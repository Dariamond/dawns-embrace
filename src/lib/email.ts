// Resend email client. ALL sends are wrapped so a transactional email failure
// is logged and returned as a failure result — never thrown — so it can never
// block the calling operation (registration, order status change, etc.).

import { Resend } from "resend";

import { env } from "@/lib/env";

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

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
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;color:#111">
      <h1 style="color:#060e6e;font-size:20px">Welcome to Dawn's Embrace</h1>
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
    </div>
  `;

  return sendEmail({
    to,
    subject: "Verify your Dawn's Embrace account",
    html,
  });
}
