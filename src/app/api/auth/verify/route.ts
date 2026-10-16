// GET/POST /api/auth/verify — consume a verification token and mark the user's
// email verified. GET is used by the emailed link (redirects to the /verify page
// with a status). POST is used by the client verify page (returns JSON).

import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { consumeVerificationToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

async function verifyToken(
  rawToken: string | null,
): Promise<"success" | "invalid"> {
  if (!rawToken) {
    return "invalid";
  }

  const userId = await consumeVerificationToken(rawToken);
  if (!userId) {
    return "invalid";
  }

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  return "success";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const status = await verifyToken(token);

  // Redirect the browser (emailed link) back to the verify page with status.
  const redirectUrl = new URL("/verify", env.nextAuthUrl);
  redirectUrl.searchParams.set("status", status);
  return NextResponse.redirect(redirectUrl);
}

export async function POST(req: Request) {
  let token: string | null = null;
  try {
    const body = (await req.json()) as { token?: string };
    token = body.token ?? null;
  } catch {
    token = null;
  }

  const status = await verifyToken(token);
  if (status === "success") {
    return NextResponse.json({ status: "success" });
  }
  return NextResponse.json(
    { status: "invalid", error: "This link is invalid or has expired." },
    { status: 400 },
  );
}
