// DELETE /api/products/[id]/images/[imageId] — admin-only: remove a sub-image
// (deletes the Cloudinary asset best-effort, then the ProductImage row).

import { NextResponse } from "next/server";

import { deleteAsset } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id, imageId } = await params;

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
  });
  if (!image || image.productId !== id) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  // Best-effort Cloudinary cleanup (never blocks the row delete).
  if (image.publicId) {
    await deleteAsset(image.publicId, "image");
  }

  await prisma.productImage.delete({ where: { id: imageId } });

  return NextResponse.json({ ok: true });
}
