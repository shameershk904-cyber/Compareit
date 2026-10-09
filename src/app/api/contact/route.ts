import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { sendContactNotification } from "@/lib/notifications";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please provide a valid email address").max(150),
  inquiry: z.string().trim().max(50).default("general"),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(200),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Invalid input data";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const { name, email, inquiry, subject, message } = result.data;

    // 1. Store in Database
    const savedMessage = await prisma.contactMessage.create({
      data: {
        name,
        email: email.toLowerCase(),
        inquiry,
        subject,
        message,
        status: "UNREAD",
      },
    });

    // 2. Dispatch notifications (Webhook / Email) in background
    sendContactNotification({
      id: savedMessage.id,
      name,
      email,
      inquiry,
      subject,
      message,
    }).catch((err) => {
      console.error("[POST /api/contact] Notification dispatch error:", err);
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your inquiry has been received. Our team will get back to you shortly.",
        id: savedMessage.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/contact] Internal Server Error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to process your request at this time. Please try again later." },
      { status: 500 }
    );
  }
}
