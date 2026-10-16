// Product detail + admin mutations.
//   GET    /api/products/[id]  — public product detail.
//   PATCH  /api/products/[id]  — admin edit (name/description/dialColor/price/stock/isActive).
//   DELETE /api/products/[id]  — admin soft-delete (isActive=false + Cloudinary cleanup).

import { NextResponse } from "next/server";

import { deleteImage } from "@/lib/cloudinary";
import { getProduct } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { productUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  return NextResponse.json({ product });
}

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

  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await getProduct(id);
  if (!existing) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ product });
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

  const existing = await getProduct(id);
  if (!existing) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  // Soft-delete: hide from the storefront rather than destroying order history.
  const product = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  // Best-effort Cloudinary cleanup (never blocks the deactivation).
  if (existing.imagePublicId) {
    await deleteImage(existing.imagePublicId);
  }

  return NextResponse.json({ product });
}
