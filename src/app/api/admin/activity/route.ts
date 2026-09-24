import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR", "VIEWER"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const userEmail = searchParams.get("userEmail");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "25", 10)));
  const isExport = searchParams.get("export") === "csv";

  try {
    const where: any = {};

    if (action && action !== "ALL") {
      where.action = action;
    }

    if (userEmail) {
      where.userEmail = { contains: userEmail, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { userEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isExport) {
      const allLogs = await prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 1000,
      });

      const header = "ID,Timestamp,User Email,Action,Entity,Entity ID,Details\n";
      const rows = allLogs
        .map((log) => {
          const detailsStr = JSON.stringify(log.details || {}).replace(/"/g, '""');
          return `"${log.id}","${log.createdAt.toISOString()}","${log.userEmail}","${log.action}","${log.entity}","${log.entityId || ""}","${detailsStr}"`;
        })
        .join("\n");

      return new NextResponse(header + rows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="compareit-activity-logs-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    const [totalCount, logs] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        userEmail: l.userEmail,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        details: l.details,
        createdAt: l.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (err: any) {
    console.error("Activity logs query error:", err);
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 });
  }
}
