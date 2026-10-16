// POST /api/auth/resend-verification — issue a fresh verification token + email
// for an unverified account. Responds generically to avoid leaking which emails
// exist; email send failures are logged, never thrown.

import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

const resendSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = resendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  const genericResponse = {
    message:
      "If that account exists and is unverified, a new verification email is on its way.",
  };

  // Only (re)send for an existing, still-unverified account.
  if (user && user.emailVerified === null) {
    const rawToken = await createVerificationToken(user.id);
    const link = `${env.nextAuthUrl}/verify?token=${rawToken}`;
    const result = await sendVerificationEmail(user.email, link);
    if (!result.ok) {
      console.error(
        `[resend-verification] email failed for ${user.email}: ${result.error}`,
      );
    }
  }

  return NextResponse.json(genericResponse, { status: 200 });
}
