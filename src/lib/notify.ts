// Notification service (design.md §8). notify() writes an in-app Notification
// row then sends a Resend email. Email failures are logged and NEVER thrown, so
// a failed email can never block the order operation that triggered it.

import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { formatKobo } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export type NotifyInput = {
  title: string;
  body: string;
  orderId?: string;
};

function notificationHtml(title: string, body: string): string {
  return `
    <div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;color:#111">
      <h1 style="color:#060e6e;font-size:20px">${title}</h1>
      <p>${body}</p>
      <p style="font-size:12px;color:#888">Dawns Embrace — A new day, a new you.</p>
    </div>
  `;
}

/**
 * Writes an in-app Notification for the user and emails them. The DB write is
 * awaited (it's part of the operation); the email is best-effort — any failure
 * is logged inside sendEmail and swallowed here so it can't block the caller.
 */
export async function notify(
  userId: string,
  { title, body, orderId }: NotifyInput,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: { userId, title, body, orderId: orderId ?? null },
    });
  } catch (error) {
    // Even the in-app write shouldn't crash an order op; log and continue.
    console.error("[notify] failed to write notification row:", error);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (user?.email) {
      const result = await sendEmail({
        to: user.email,
        subject: title,
        html: notificationHtml(title, body),
      });
      if (!result.ok) {
        console.error(`[notify] email to ${user.email} failed: ${result.error}`);
      }
    }
  } catch (error) {
    console.error("[notify] email step threw:", error);
  }
}

/** Emails ADMIN_EMAIL when a new order is paid. Failures are logged, never thrown. */
export async function notifyAdminNewOrder(order: {
  id: string;
  totalKobo: number;
}): Promise<void> {
  try {
    const adminEmail = env.optional("ADMIN_EMAIL");
    if (!adminEmail) {
      console.error("[notify] ADMIN_EMAIL not set; skipping admin notification.");
      return;
    }

    const title = "New paid order";
    const body = `Order ${order.id} has been paid (${formatKobo(order.totalKobo)}). It is awaiting approval.`;

    const result = await sendEmail({
      to: adminEmail,
      subject: title,
      html: notificationHtml(title, body),
    });
    if (!result.ok) {
      console.error(`[notify] admin email failed: ${result.error}`);
    }
  } catch (error) {
    console.error("[notify] admin notification threw:", error);
  }
}
