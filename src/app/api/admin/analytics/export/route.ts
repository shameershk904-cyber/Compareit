import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { authenticated, user, error } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
  }

  const range = req.nextUrl.searchParams.get("range") || "30d";
  const now = new Date();
  let startDate = new Date();

  if (range === "today") {
    startDate.setHours(0, 0, 0, 0);
  } else if (range === "7d") {
    startDate.setDate(now.getDate() - 7);
  } else if (range === "30d") {
    startDate.setDate(now.getDate() - 30);
  } else {
    startDate = new Date(2025, 0, 1);
  }

  try {
    const records = await prisma.pageView.findMany({
      where: {
        createdAt: { gte: startDate },
        isBot: false,
      },
      orderBy: { createdAt: "desc" },
      take: 10000,
    });

    const headers = [
      "ID",
      "Date Time (UTC)",
      "Path",
      "Device",
      "Browser",
      "Operating System",
      "Country",
      "Referrer",
      "Session ID",
      "UTM Source",
      "UTM Medium",
    ];

    const escapeCsv = (str: string | null | undefined) => {
      if (!str) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = records.map((r) => [
      escapeCsv(r.id),
      escapeCsv(r.createdAt.toISOString()),
      escapeCsv(r.path),
      escapeCsv(r.device),
      escapeCsv(r.browser),
      escapeCsv(r.os),
      escapeCsv(r.country),
      escapeCsv(r.referrer),
      escapeCsv(r.sessionId),
      escapeCsv(r.utmSource),
      escapeCsv(r.utmMedium),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const filename = `compareit-analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("Export CSV error:", err);
    return NextResponse.json({ error: "Failed to generate CSV export" }, { status: 500 });
  }
}
