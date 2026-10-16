// GET /api/products — list active products for the storefront.
// (The admin POST create branch is added in FEAT-005.)

import { NextResponse } from "next/server";

import { listActiveProducts, type ProductSort } from "@/lib/products";

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
