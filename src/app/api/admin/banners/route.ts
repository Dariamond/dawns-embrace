// Admin banner collection API.
//   GET  /api/admin/banners — admin-only list of all banners.
//   POST /api/admin/banners — admin-only create (appends at the next sortOrder).

import { NextResponse } from "next/server";

import { listAllBanners } from "@/lib/banners";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { bannerSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const banners = await listAllBanners();
  return NextResponse.json({ banners });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = bannerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Append after the current last banner (0 when none exist yet).
  const { _max } = await prisma.banner.aggregate({
    _max: { sortOrder: true },
  });
  const sortOrder = _max.sortOrder === null ? 0 : _max.sortOrder + 1;

  const banner = await prisma.banner.create({
    data: {
      imageUrl: data.imageUrl,
      publicId: data.publicId ?? null,
      linkUrl: data.linkUrl ?? null,
      sortOrder,
      isActive: true,
    },
  });

  return NextResponse.json({ banner }, { status: 201 });
}
