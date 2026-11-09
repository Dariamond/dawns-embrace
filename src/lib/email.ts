// Resend email client. ALL sends are wrapped so a transactional email failure
// is logged and returned as a failure result — never thrown — so it can never
// block the calling operation (registration, order status change, etc.).

import { Resend } from "resend";

import { env } from "@/lib/env";

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

/**
 * Public (Cloudinary) URL of the Dawn's Embrace framed brand lockup (mark + name
 * + tagline on the patterned navy background). Cropped to a banner shape and
 * sized for email via Cloudinary transformations so it fills the header band
 * edge-to-edge without a huge square.
 */
const EMAIL_LOGO_URL =
  "https://res.cloudinary.com/meejmjix/image/upload/c_crop,g_center,w_1080,h_460/w_960,q_auto,f_jpg/dawns-embrace/brand/email-logo-v2.jpg";

/**
 * Wraps email body content in a branded layout: a full-width header image (the
 * framed brand lockup, which carries its own navy background), the content, and
 * a footer. Uses inline styles and absolute image URLs because email clients
 * don't load CSS or local assets.
 */
export function emailLayout(contentHtml: string): string {
  return `
  <div style="background:#f3f4f6;padding:24px 0;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
      <img src="${EMAIL_LOGO_URL}" alt="Dawn's Embrace — A new day, a new you"
           style="display:block;width:100%;height:auto;border:0" />
      <div style="padding:28px 24px;color:#111">
        ${contentHtml}
      </div>
      <div style="padding:16px 24px;background:#fafafa;border-top:1px solid #eee;text-align:center">
        <p style="margin:0;font-size:12px;color:#888">Dawn's Embrace</p>
      </div>
    </div>
  </div>`;
}

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    client = new Resend(env.resendApiKey);
  }
  return client;
}

/** Sends an email; catches and logs any failure without throwing. */
export async function sendEmail(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  try {
    const { data, error } = await getClient().emails.send({
      from: env.emailFrom,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error("[email] send failed:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id ?? null };
  } catch (error) {
    // Covers missing API key / network / client errors — never rethrow.
    console.error("[email] send threw:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown email error.",
    };
  }
}

/** Sends the account verification email. Failures are logged, never thrown. */
export async function sendVerificationEmail(
  to: string,
  link: string,
): Promise<SendEmailResult> {
  const html = emailLayout(`
    <h1 style="color:#060e6e;font-size:20px;margin-top:0">Welcome to Dawn's Embrace</h1>
    <p>A new day, a new you. Confirm your email to finish setting up your account.</p>
    <p style="margin:24px 0">
      <a href="${link}"
         style="background:#1f27e9;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">
        Verify my email
      </a>
    </p>
    <p style="font-size:13px;color:#555">
      Or paste this link into your browser:<br />
      <a href="${link}">${link}</a>
    </p>
    <p style="font-size:12px;color:#888">This link expires in 24 hours.</p>
  `);

  return sendEmail({
    to,
    subject: "Verify your Dawn's Embrace account",
    html,
  });
}
