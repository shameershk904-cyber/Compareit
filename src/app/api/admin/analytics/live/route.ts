import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Fetch recent active views in last 5 minutes
    const recentViews = await prisma.pageView.findMany({
      where: {
        createdAt: { gte: fiveMinutesAgo },
        isBot: false,
      },
      select: {
        sessionId: true,
        path: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const uniqueSessions = new Set(recentViews.map((v) => v.sessionId));

    // Aggregate active pages
    const pageCounts: Record<string, number> = {};
    for (const v of recentViews) {
      pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
    }

    const activePages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      activeUsers: uniqueSessions.size,
      activePages,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("Live analytics error:", err);
    return NextResponse.json(
      { activeUsers: 0, activePages: [], error: "Database error" },
      { status: 500 }
    );
  }
}
