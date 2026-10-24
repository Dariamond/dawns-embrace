// Admin banner item API.
//   PATCH  /api/admin/banners/[id] — toggle active, reorder (sortOrder), set/clear link.
//   DELETE /api/admin/banners/[id] — remove the row + best-effort Cloudinary cleanup.

import { NextResponse } from "next/server";

import { deleteAsset } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { bannerUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = bannerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Banner not found." }, { status: 404 });
  }

  const banner = await prisma.banner.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ banner });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Banner not found." }, { status: 404 });
  }

  await prisma.banner.delete({ where: { id } });

  // Best-effort Cloudinary cleanup (never blocks the delete). Seeded local
  // /brand/*.jpg banners have no publicId, so skip them.
  if (existing.publicId) {
    await deleteAsset(existing.publicId, "image");
  }

  return NextResponse.json({ ok: true });
}
