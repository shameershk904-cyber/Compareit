import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyServerSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  // 1. Check PostgreSQL Database connection and latency
  let dbStatus = "healthy";
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (err: any) {
    dbStatus = "error";
    dbError = err.message || "Failed to query database";
  }

  // 2. Check Supabase Storage banners bucket
  let storageStatus = "healthy";
  let storageLatencyMs = 0;
  let storageDetails = {
    bucketName: "banners",
    exists: false,
    public: true,
  };
  let storageError: string | null = null;

  try {
    const storageStart = Date.now();
    const { data: buckets, error: bErr } = await supabaseAdmin.storage.listBuckets();
    storageLatencyMs = Date.now() - storageStart;

    if (bErr) {
      storageStatus = "warning";
      storageError = bErr.message;
    } else {
      const bannerBucket = (buckets as Array<{ name: string; public: boolean }> | null)?.find(
        (b) => b.name === "banners"
      );
      if (bannerBucket) {
        storageDetails.exists = true;
        storageDetails.public = bannerBucket.public;
      } else {
        storageStatus = "warning";
        storageError = "Bucket 'banners' not found in project. Run upload or create in Supabase.";
      }
    }
  } catch (err: any) {
    storageStatus = "warning";
    storageError = err.message || "Could not connect to Supabase Storage";
  }

  // 3. Counts summary
  let counts = { users: 0, banners: 0, pageViews: 0, searchLogs: 0, activityLogs: 0 };
  try {
    const [users, banners, pageViews, searchLogs, activityLogs] = await Promise.all([
      prisma.user.count(),
      prisma.banner.count(),
      prisma.pageView.count(),
      prisma.searchLog.count(),
      prisma.activityLog.count(),
    ]);
    counts = { users, banners, pageViews, searchLogs, activityLogs };
  } catch {}

  const totalDurationMs = Date.now() - startTime;

  return NextResponse.json({
    status: dbStatus === "healthy" && storageStatus !== "error" ? "operational" : "degraded",
    timestamp: new Date().toISOString(),
    totalDurationMs,
    environment: {
      nodeEnv: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
      region: "ap-northeast-2 (Seoul Pooler)",
    },
    services: {
      database: {
        provider: "PostgreSQL on Supabase (pgbouncer 6543)",
        status: dbStatus,
        latencyMs: dbLatencyMs,
        error: dbError,
      },
      storage: {
        provider: "Supabase Storage",
        status: storageStatus,
        latencyMs: storageLatencyMs,
        details: storageDetails,
        error: storageError,
      },
      auth: {
        provider: "Auth.js v5 + Argon2",
        status: "active",
        sessionRole: user.role,
        sessionEmail: user.email,
      },
    },
    counts,
  });
}
