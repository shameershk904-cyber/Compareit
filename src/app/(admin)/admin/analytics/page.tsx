import { verifyServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AnalyticsClient } from "@/components/admin/AnalyticsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Traffic Analytics | CompareIt.pk Admin",
  description: "Visitor volume, devices, and traffic behavior telemetry",
};

export default async function AnalyticsPage() {
  const { authenticated, user } = await verifyServerSession(["ADMIN", "EDITOR"]);
  if (!authenticated || !user) {
    redirect("/admin/login?error=AccessDenied");
  }

  // Pre-fetch 7-day initial stats on server
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let initialData = null;

  try {
    const views = await prisma.pageView.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        isBot: false,
      },
      select: {
        id: true,
        path: true,
        referrer: true,
        device: true,
        browser: true,
        os: true,
        ipHash: true,
        sessionId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const totalPageViews = views.length;
    const uniqueVisitors = new Set(views.map((v) => v.ipHash)).size;
    const totalSessions = new Set(views.map((v) => v.sessionId)).size;
    const viewsPerSession =
      totalSessions > 0 ? (totalPageViews / totalSessions).toFixed(1) : "0";

    // Time series (past 7 days)
    const timeMap: Record<string, { pageviews: number; visitors: Set<string> }> = {};
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toISOString().slice(5, 10);
      timeMap[label] = { pageviews: 0, visitors: new Set() };
    }
    for (const v of views) {
      const label = new Date(v.createdAt).toISOString().slice(5, 10);
      if (timeMap[label]) {
        timeMap[label].pageviews++;
        timeMap[label].visitors.add(v.ipHash);
      }
    }

    const timeSeries = Object.entries(timeMap).map(([time, data]) => ({
      time,
      pageviews: data.pageviews,
      visitors: data.visitors.size,
    }));

    // Top Pages
    const pageCounts: Record<string, number> = {};
    for (const v of views) {
      pageCounts[v.path] = (pageCounts[v.path] || 0) + 1;
    }
    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({
        path,
        views: count,
        percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Devices
    const deviceCounts: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
    for (const v of views) {
      const dev = v.device?.toLowerCase() || "desktop";
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    }
    const devices = [
      { name: "Mobile", value: deviceCounts.mobile, color: "#f59e0b" },
      { name: "Desktop", value: deviceCounts.desktop, color: "#3b82f6" },
      { name: "Tablet", value: deviceCounts.tablet, color: "#10b981" },
    ];

    // Browsers
    const browserCounts: Record<string, number> = {};
    for (const v of views) {
      const b = v.browser || "Other";
      browserCounts[b] = (browserCounts[b] || 0) + 1;
    }
    const browsers = Object.entries(browserCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // OS
    const osCounts: Record<string, number> = {};
    for (const v of views) {
      const os = v.os || "Other";
      osCounts[os] = (osCounts[os] || 0) + 1;
    }
    const osList = Object.entries(osCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Referrers
    const referrerCounts: Record<string, number> = {};
    for (const v of views) {
      let ref = "Direct";
      if (v.referrer) {
        try {
          const url = new URL(v.referrer);
          ref = url.hostname.replace(/^www\./, "");
        } catch {
          ref = v.referrer.slice(0, 30);
        }
      }
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    }
    const topReferrers = Object.entries(referrerCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    initialData = {
      summary: {
        totalPageViews,
        uniqueVisitors,
        totalSessions,
        viewsPerSession,
        range: "7d",
      },
      timeSeries,
      topPages,
      devices,
      browsers,
      osList,
      topReferrers,
    };
  } catch (err) {
    console.error("Failed to load initial analytics on server:", err);
  }

  return <AnalyticsClient initialData={initialData} />;
}
