import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseUserAgent, extractClientIp, generateDailyIpHash } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.path !== "string") {
      return NextResponse.json({ error: "Invalid tracking payload" }, { status: 400 });
    }

    const {
      path,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      screenSize,
      sessionId,
    } = body;

    // Ignore admin traffic tracking to keep consumer metrics clean
    if (path.startsWith("/admin") || path.startsWith("/api/")) {
      return new NextResponse(null, { status: 204 });
    }

    const ua = req.headers.get("user-agent") || "";
    const parsedUA = parseUserAgent(ua);
    const clientIp = extractClientIp(req.headers);
    const ipHash = generateDailyIpHash(clientIp);

    const country =
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-vercel-ip-country") ||
      "PK";

    // Asynchronously record page view
    await prisma.pageView.create({
      data: {
        path: path.slice(0, 500),
        referrer: typeof referrer === "string" ? referrer.slice(0, 500) : null,
        utmSource: typeof utmSource === "string" ? utmSource.slice(0, 100) : null,
        utmMedium: typeof utmMedium === "string" ? utmMedium.slice(0, 100) : null,
        utmCampaign: typeof utmCampaign === "string" ? utmCampaign.slice(0, 100) : null,
        device: parsedUA.device,
        browser: parsedUA.browser,
        os: parsedUA.os,
        screenSize: typeof screenSize === "string" ? screenSize.slice(0, 50) : null,
        country: country.slice(0, 5),
        ipHash,
        sessionId: typeof sessionId === "string" ? sessionId.slice(0, 100) : "anon",
        isBot: parsedUA.isBot,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Telemetry track error:", error);
    // Return 204 even on error so client tracker never throws or interrupts user experience
    return new NextResponse(null, { status: 204 });
  }
}
