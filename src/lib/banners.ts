// Banner query helpers for the shop carousel (storefront read side) and the
// admin manager.

import { prisma } from "@/lib/prisma";
import { type Banner } from "@/generated/prisma";

/** Active banners for the storefront carousel, ordered for display. */
export async function listActiveBanners(): Promise<Banner[]> {
  return prisma.banner.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

/** All banners for the admin manager, ordered the same way. */
export async function listAllBanners(): Promise<Banner[]> {
  return prisma.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}
