import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { Role } from "@prisma/client";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        try {
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
          });

          if (!user || !user.passwordHash) {
            return null;
          }

          const isValid = await argon2.verify(user.passwordHash, password);
          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email.split("@")[0],
            role: user.role,
            mustChangePassword: user.mustChangePassword,
          };
        } catch (error) {
          console.error("Auth authorize error:", error);
          return null;
        }
      },
    }),
  ],
});

/**
 * Re-verifies active session and database role inside Server Actions and Route Handlers.
 * Throws or returns null if unauthenticated or role insufficient.
 */
export async function verifyServerSession(requiredRoles?: Role[]) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return { authenticated: false as const, user: null, error: "Unauthorized" };
  }

  // Re-verify against database
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mustChangePassword: true,
        avatarUrl: true,
      },
    });

    if (!dbUser) {
      return { authenticated: false as const, user: null, error: "User no longer exists" };
    }

    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(dbUser.role)) {
        return { authenticated: false as const, user: null, error: "Forbidden: insufficient permissions" };
      }
    }

    return { authenticated: true as const, user: dbUser, error: null };
  } catch (error) {
    console.error("Database role re-verification error:", error);
    // If DB is unreachable or in cold start, fallback to session token role with caution
    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(session.user.role as Role)) {
      return { authenticated: false as const, user: null, error: "Forbidden" };
    }
    return {
      authenticated: true as const,
      user: {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.name || null,
        role: (session.user.role as Role) || Role.VIEWER,
        mustChangePassword: session.user.mustChangePassword,
        avatarUrl: null,
      },
      error: null,
    };
  }
}
