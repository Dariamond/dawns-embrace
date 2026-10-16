// Customer orders list. Gated with requireUser().

import Link from "next/link";

import { formatKobo } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requireUser();

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gulf-blue">Your orders</h1>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-xl bg-brand-white p-8 text-center shadow-sm">
          <p className="text-gray-600">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-lg bg-persian-blue px-5 py-2.5 font-medium text-brand-white transition hover:bg-gulf-blue"
          >
            Browse watches
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="flex items-center justify-between gap-4 rounded-xl bg-brand-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <p className="font-medium text-gulf-blue">
                    Order {order.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-persian-blue">
                    {formatKobo(order.totalKobo)}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {order.status}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
