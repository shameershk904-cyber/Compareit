/**
 * Contact notification dispatcher.
 * Supports:
 *  1. Webhooks (Discord, Slack, or generic webhooks via CONTACT_WEBHOOK_URL / DISCORD_WEBHOOK_URL / SLACK_WEBHOOK_URL)
 *  2. Email via Resend REST API (RESEND_API_KEY + CONTACT_NOTIFICATION_EMAIL)
 *
 * Never throws errors so customer submissions are never interrupted.
 */

export interface ContactMessagePayload {
  id?: string;
  name: string;
  email: string;
  inquiry: string;
  subject: string;
  message: string;
}

const INQUIRY_LABELS: Record<string, string> = {
  price_report: "🚨 Report Incorrect Price",
  missing_phone: "📱 Missing Phone Listing",
  partnership: "🤝 Partnership / Advertising",
  data_update: "🔄 Request Data Update",
  technical: "🐛 Technical Issue / Bug",
  general: "💬 General Inquiry",
};

export async function sendContactNotification(payload: ContactMessagePayload): Promise<{
  webhookSent: boolean;
  emailSent: boolean;
}> {
  const inquiryLabel = INQUIRY_LABELS[payload.inquiry] || payload.inquiry;
  let webhookSent = false;
  let emailSent = false;

  const webhookUrl =
    process.env.CONTACT_WEBHOOK_URL ||
    process.env.DISCORD_WEBHOOK_URL ||
    process.env.SLACK_WEBHOOK_URL;

  const resendApiKey = process.env.RESEND_API_KEY;
  const notificationEmail =
    process.env.CONTACT_NOTIFICATION_EMAIL ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    "hello@compareit.pk";

  // 1. Dispatch Webhook (Discord / Slack / Generic)
  if (webhookUrl) {
    try {
      if (webhookUrl.includes("discord.com/api/webhooks")) {
        // Discord Webhook with Rich Embed
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "CompareIt.pk Alerts",
            avatar_url: "https://compareit.pk/favicon.ico",
            embeds: [
              {
                title: `📬 New Message: ${payload.subject}`,
                description: payload.message,
                color: 0xf97316, // Orange 500
                fields: [
                  { name: "Sender", value: `${payload.name} (${payload.email})`, inline: true },
                  { name: "Inquiry Type", value: inquiryLabel, inline: true },
                ],
                footer: {
                  text: "CompareIt.pk • View in Admin Dashboard (/admin/messages)",
                },
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
        webhookSent = true;
      } else {
        // Slack or generic incoming webhook
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `📬 *New Contact Inquiry received on CompareIt.pk*\n*From:* ${payload.name} (${payload.email})\n*Type:* ${inquiryLabel}\n*Subject:* ${payload.subject}\n*Message:* ${payload.message}`,
          }),
        });
        webhookSent = true;
      }
    } catch (err) {
      console.error("[Notifications] Webhook dispatch error:", err);
    }
  }

  // 2. Dispatch Email via Resend REST API (Zero external SDK required)
  if (resendApiKey) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || "CompareIt.pk <onboarding@resend.dev>";
      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
            <div style="background-color: #f97316; color: #ffffff; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 14px;">CompareIt.pk</div>
            <span style="font-size: 14px; color: #6b7280; font-weight: 500;">New Contact Form Submission</span>
          </div>

          <h2 style="font-size: 20px; font-weight: bold; color: #111827; margin: 0 0 16px;">${escapeHtml(payload.subject)}</h2>

          <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f97316;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #4b5563;"><strong>Sender:</strong> ${escapeHtml(payload.name)} &lt;<a href="mailto:${escapeHtml(payload.email)}" style="color: #ea580c;">${escapeHtml(payload.email)}</a>&gt;</p>
            <p style="margin: 0; font-size: 13px; color: #4b5563;"><strong>Category:</strong> <span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${escapeHtml(inquiryLabel)}</span></p>
          </div>

          <div style="margin-bottom: 24px;">
            <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #9ca3af; margin-bottom: 8px;">Message Content:</p>
            <div style="font-size: 14px; line-height: 1.6; color: #1f2937; white-space: pre-wrap; background: #ffffff; padding: 14px; border: 1px solid #f3f4f6; border-radius: 8px;">${escapeHtml(payload.message)}</div>
          </div>

          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f3f4f6;">
            <a href="mailto:${escapeHtml(payload.email)}?subject=Re: ${encodeURIComponent(payload.subject)}" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600;">Reply to ${escapeHtml(payload.name)}</a>
          </div>
        </div>
      `;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [notificationEmail],
          reply_to: payload.email,
          subject: `[CompareIt.pk] ${payload.subject} (from ${payload.name})`,
          html: htmlBody,
        }),
      });

      if (res.ok) {
        emailSent = true;
      } else {
        const errJson = await res.json().catch(() => null);
        console.error("[Notifications] Resend API returned error:", errJson);
      }
    } catch (err) {
      console.error("[Notifications] Email dispatch error:", err);
    }
  }

  if (!webhookUrl && !resendApiKey) {
    console.info(
      "[Notifications] Contact message stored in database. Tip: Set CONTACT_WEBHOOK_URL (Discord/Slack) or RESEND_API_KEY in .env for instant real-time alerts."
    );
  }

  return { webhookSent, emailSent };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
