import { verifyServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ActivityClient, type ActivityRecord } from "@/components/admin/ActivityClient";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const { authenticated } = await verifyServerSession(["ADMIN", "EDITOR", "VIEWER"]);

  if (!authenticated) {
    redirect("/admin/login?error=AccessDenied");
  }

  let logs: ActivityRecord[] = [];
  let totalCount = 0;

  try {
    const [count, rawLogs] = await Promise.all([
      prisma.activityLog.count(),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    totalCount = count;
    logs = rawLogs.map((l) => ({
      id: l.id,
      userEmail: l.userEmail,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      details: l.details,
      createdAt: l.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to prefetch activity logs:", error);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <ActivityClient initialLogs={logs} totalCount={totalCount} />
    </div>
  );
}
