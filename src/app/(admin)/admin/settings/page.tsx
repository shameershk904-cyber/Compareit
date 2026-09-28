import { verifyServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/storage";
import {
  SettingsClient,
  type TeamMember,
  type DiagnosticsData,
} from "@/components/admin/SettingsClient";

export const dynamic = "force-dynamic";

async function fetchInitialDiagnostics(
  userEmail: string,
  userRole: string
): Promise<DiagnosticsData | null> {
  const startMs = Date.now();
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbStart;

    const storageDetails = { bucketName: "banners", exists: false, public: true };
    let storageLatencyMs = 0;
    try {
      const sStart = Date.now();
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      storageLatencyMs = Date.now() - sStart;
      const bBucket = (buckets as Array<{ name: string; public: boolean }> | null)?.find(
        (b) => b.name === "banners"
      );
      if (bBucket) {
        storageDetails.exists = true;
        storageDetails.public = bBucket.public;
      }
    } catch {
      // storage test failed gracefully
    }

    const [users, banners, pageViews, searchLogs, activityLogs] = await Promise.all([
      prisma.user.count(),
      prisma.banner.count(),
      prisma.pageView.count(),
      prisma.searchLog.count(),
      prisma.activityLog.count(),
    ]);

    return {
      status: "operational",
      timestamp: new Date().toISOString(),
      totalDurationMs: Date.now() - startMs,
      environment: {
        nodeEnv: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
        region: "ap-northeast-2 (Seoul Pooler)",
      },
      services: {
        database: {
          provider: "PostgreSQL on Supabase (pgbouncer 6543)",
          status: "healthy",
          latencyMs: dbLatencyMs,
        },
        storage: {
          provider: "Supabase Storage",
          status: storageDetails.exists ? "healthy" : "warning",
          latencyMs: storageLatencyMs,
          details: storageDetails,
        },
        auth: {
          provider: "Auth.js v5 + Argon2",
          status: "active",
          sessionRole: userRole,
          sessionEmail: userEmail,
        },
      },
      counts: {
        users,
        banners,
        pageViews,
        searchLogs,
        activityLogs,
      },
    };
  } catch (err) {
    console.error("Failed to compile initial diagnostics:", err);
    return null;
  }
}

export default async function AdminSettingsPage() {
  const { authenticated, user } = await verifyServerSession(["ADMIN", "EDITOR"]);

  if (!authenticated || !user) {
    redirect("/admin/login?error=AccessDenied");
  }

  // 1. Fetch team members
  let team: TeamMember[] = [];
  try {
    const rawUsers = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    team = rawUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as TeamMember["role"],
      mustChangePassword: u.mustChangePassword,
      createdAt: u.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error("Failed to load team roster:", err);
  }

  // 2. Fetch initial diagnostics
  const diagnostics = await fetchInitialDiagnostics(user.email, user.role);

  return (
    <div className="max-w-7xl mx-auto">
      <SettingsClient
        currentUser={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }}
        initialTeam={team}
        initialDiagnostics={diagnostics}
      />
    </div>
  );
}
