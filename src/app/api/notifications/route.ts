// GET /api/notifications — list the current user's notifications (newest first).
// PATCH /api/notifications — mark notifications read (all, or a specific id).

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ notifications });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { id?: unknown } = {};
  try {
    body = (await req.json()) as { id?: unknown };
  } catch {
    // No body = mark all read.
  }

  const id = typeof body.id === "string" && body.id ? body.id : null;

  const result = await prisma.notification.updateMany({
    where: {
      userId: user.id,
      ...(id ? { id } : {}),
      read: false,
    },
    data: { read: true },
  });

  return NextResponse.json({ updated: result.count });
}
