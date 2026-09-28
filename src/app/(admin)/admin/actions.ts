"use server";

import { z } from "zod";
import argon2 from "argon2";
import prisma from "@/lib/prisma";
import { verifyServerSession } from "@/lib/auth";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters long"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(formData: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  // 1. Double check authentication and database role
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return { success: false, error: error || "Unauthorized access." };
  }

  // 2. Validate input schema
  const parsed = changePasswordSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid password data.",
    };
  }

  try {
    // 3. Fetch current password hash from DB
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!dbUser) {
      return { success: false, error: "User account could not be found." };
    }

    // 4. Verify current password
    const isCurrentValid = await argon2.verify(dbUser.passwordHash, parsed.data.currentPassword);
    if (!isCurrentValid) {
      return { success: false, error: "Current password is incorrect." };
    }

    // 5. Hash new password with Argon2
    const newPasswordHash = await argon2.hash(parsed.data.newPassword);

    // 6. Update user in database & clear mustChangePassword
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    // 7. Write audit log entry
    await prisma.activityLog.create({
      data: {
        userId: dbUser.id,
        userEmail: dbUser.email,
        action: "PASSWORD_CHANGED",
        entity: "USER",
        entityId: dbUser.id,
        details: {
          note: "User updated password and cleared temporary status",
          timestamp: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: "Your password has been successfully updated.",
    };
  } catch (err: unknown) {
    console.error("changePasswordAction error:", err);
    return {
      success: false,
      error: "A database error occurred while updating your password.",
    };
  }
}
