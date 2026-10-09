import { verifyServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { MessagesClient, type ContactMessageRecord } from "@/components/admin/MessagesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inquiries & Messages | CompareIt.pk Admin",
  description: "Manage incoming contact inquiries and user reports",
};

export default async function AdminMessagesPage() {
  const { authenticated } = await verifyServerSession(["ADMIN", "EDITOR"]);

  if (!authenticated) {
    redirect("/admin/login?error=AccessDenied");
  }

  let messages: ContactMessageRecord[] = [];
  try {
    const rawMessages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    messages = rawMessages.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      inquiry: m.inquiry,
      subject: m.subject,
      message: m.message,
      status: m.status as ContactMessageRecord["status"],
      notes: m.notes,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to load contact messages:", error);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <MessagesClient initialMessages={messages} />
    </div>
  );
}
