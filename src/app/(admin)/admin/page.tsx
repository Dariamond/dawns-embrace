// Admin dashboard home. Shows a "new orders" indicator — the count of orders
// that are PAID but not yet APPROVED (design.md §8) — plus quick links.

import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [newOrders, totalProducts, totalOrders] = await Promise.all([
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.product.count(),
    prisma.order.count(),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gulf-blue">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Overview of your store at a glance.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <Link
          href="/admin/orders"
          className="rounded-xl bg-brand-white p-6 shadow-sm transition hover:shadow"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              New orders
            </span>
            {newOrders > 0 && (
              <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-persian-blue px-2 py-0.5 text-xs font-semibold text-brand-white">
                {newOrders}
              </span>
            )}
          </div>
          <p className="mt-3 text-3xl font-bold text-gulf-blue">{newOrders}</p>
          <p className="mt-1 text-xs text-gray-500">Paid, awaiting approval</p>
        </Link>

        <div className="rounded-xl bg-brand-white p-6 shadow-sm">
          <span className="text-sm font-medium text-gray-500">
            Total orders
          </span>
          <p className="mt-3 text-3xl font-bold text-gulf-blue">
            {totalOrders}
          </p>
        </div>

        <Link
          href="/admin/products"
          className="rounded-xl bg-brand-white p-6 shadow-sm transition hover:shadow"
        >
          <span className="text-sm font-medium text-gray-500">Products</span>
          <p className="mt-3 text-3xl font-bold text-gulf-blue">
            {totalProducts}
          </p>
          <p className="mt-1 text-xs text-gray-500">Manage catalog</p>
        </Link>
      </div>
    </div>
  );
}
