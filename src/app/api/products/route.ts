// GET /api/products — list active products for the storefront.
// POST /api/products — admin-only create (role-gated via the session user's role).

import { NextResponse } from "next/server";

import { listActiveProducts, type ProductSort } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { productSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const dialColor = searchParams.get("dialColor")?.trim() || undefined;
  const sortParam = searchParams.get("sort");
  const sort: ProductSort | undefined =
    sortParam === "price-asc" || sortParam === "price-desc"
      ? sortParam
      : undefined;

  const products = await listActiveProducts({ dialColor, sort });

  return NextResponse.json({ products });
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

  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      dialColor: data.dialColor,
      category: data.category,
      priceKobo: data.priceKobo,
      stock: data.stock,
      imageUrl: data.imageUrl,
      imagePublicId: data.imagePublicId ?? null,
      isActive: data.isActive ?? true,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
