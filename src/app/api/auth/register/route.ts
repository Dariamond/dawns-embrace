// POST /api/auth/register — create an unverified account and email a
// verification link. Always responds "check your email" on success, even if the
// email send itself failed (the failure is logged, not surfaced/blocking).

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/tokens";
import { registerSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name ?? null,
      role: "CUSTOMER",
      emailVerified: null,
    },
  });

  const rawToken = await createVerificationToken(user.id);
  const link = `${env.nextAuthUrl}/verify?token=${rawToken}`;

  // Email failure must not block registration — logged inside sendVerificationEmail.
  const result = await sendVerificationEmail(user.email, link);
  if (!result.ok) {
    console.error(
      `[register] verification email failed for ${user.email}: ${result.error}`,
    );
  }

  return NextResponse.json(
    {
      message:
        "Account created. Check your email for a verification link to finish setup.",
    },
    { status: 201 },
  );
}
