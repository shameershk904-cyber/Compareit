import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyServerSession } from "@/lib/auth";
import { Role } from "@prisma/client";
import { z } from "zod";
import argon2 from "argon2";

export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Temporary password must be at least 8 chars"),
  role: z.nativeEnum(Role).default(Role.EDITOR),
});

const updateUserSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(Role).optional(),
  name: z.string().min(1).max(60).optional(),
  mustChangePassword: z.boolean().optional(),
});

// GET: List all team users
export async function GET(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("List users error:", err);
    return NextResponse.json({ error: "Failed to list team members" }, { status: 500 });
  }
}

// POST: Add / invite a team member (ADMIN role only)
export async function POST(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN"]);
  if (!authenticated || !user) {
    return NextResponse.json(
      { error: error || "Admin privileges required to manage team members" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json(
        { error: "A team member with this email address already exists" },
        { status: 409 }
      );
    }

    // Hash password with Argon2
    const passwordHash = await argon2.hash(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        mustChangePassword: true, // Force password update on first login
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: "INVITE_USER",
        entity: "USER",
        entityId: newUser.id,
        details: {
          invitedEmail: newUser.email,
          role: newUser.role,
        },
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (err: any) {
    console.error("Create user error:", err);
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
  }
}

// PATCH: Update user role / status (ADMIN role only)
export async function PATCH(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN"]);
  if (!authenticated || !user) {
    return NextResponse.json(
      { error: error || "Admin privileges required" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { userId, role, name, mustChangePassword } = parsed.data;

    // Prevent demoting the logged-in admin if they are the only admin
    if (userId === user.id && role && role !== "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote yourself. You are the only active Admin." },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (name) updateData.name = name;
    if (typeof mustChangePassword === "boolean") updateData.mustChangePassword = mustChangePassword;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        updatedAt: true,
      },
    });

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: "UPDATE_USER",
        entity: "USER",
        entityId: updatedUser.id,
        details: {
          targetEmail: updatedUser.email,
          updatedFields: Object.keys(updateData),
        },
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error("Update user error:", err);
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 });
  }
}

// DELETE: Remove a team member (ADMIN role only)
export async function DELETE(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Admin privileges required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("id");

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: targetUserId } });

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: "DELETE_USER",
        entity: "USER",
        entityId: targetUserId,
        details: { deletedEmail: targetUser.email, role: targetUser.role },
      },
    });

    return NextResponse.json({ success: true, message: "User removed successfully" });
  } catch (err: any) {
    console.error("Delete user error:", err);
    return NextResponse.json({ error: "Failed to remove user" }, { status: 500 });
  }
}
