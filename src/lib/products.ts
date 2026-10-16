// Product query helpers for the storefront read side.

import { prisma } from "@/lib/prisma";
import type { Product } from "@/generated/prisma";

export type ProductSort = "price-asc" | "price-desc";

export type ListProductsOptions = {
  dialColor?: string;
  sort?: ProductSort;
};

/** List active products, optionally filtered by dial color and sorted by price. */
export async function listActiveProducts(
  options: ListProductsOptions = {},
): Promise<Product[]> {
  const { dialColor, sort } = options;

  return prisma.product.findMany({
    where: {
      isActive: true,
      ...(dialColor ? { dialColor } : {}),
    },
    orderBy:
      sort === "price-desc"
        ? { priceKobo: "desc" }
        : sort === "price-asc"
          ? { priceKobo: "asc" }
          : { createdAt: "desc" },
  });
}

/** Fetch a single product by id (returns null if not found). */
export async function getProduct(id: string): Promise<Product | null> {
  return prisma.product.findUnique({ where: { id } });
}

/** Distinct dial colors across active products, for the shop filter UI. */
export async function listActiveDialColors(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: { dialColor: true },
    distinct: ["dialColor"],
    orderBy: { dialColor: "asc" },
  });
  return rows.map((r) => r.dialColor);
}
