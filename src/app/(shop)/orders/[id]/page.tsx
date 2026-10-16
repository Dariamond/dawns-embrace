// Customer order detail: items, shipping address, and a status stepper built
// from OrderStatusEvent history. Gated with requireUser(); 404 if not the
// owner's order.

import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusStepper } from "@/components/status-stepper";
import { formatKobo } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: {
      items: true,
      address: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/orders"
        className="text-sm font-medium text-persian-blue hover:underline"
      >
        ← Back to orders
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-gulf-blue">
        Order {order.id.slice(0, 8)}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Placed {new Date(order.createdAt).toLocaleString()}
      </p>

      {order.paidAt && (
        <p className="mt-4 rounded-lg bg-persian-blue/10 px-4 py-3 text-sm text-gulf-blue">
          Payment received. Your order is being processed — we&apos;ll email you
          as its status changes.
        </p>
      )}

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section className="rounded-xl bg-brand-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gulf-blue">Items</h2>
          <ul className="mt-4 space-y-3">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 text-sm"
              >
                <span className="text-gray-700">
                  {item.nameSnapshot}
                  <span className="text-gray-500"> × {item.quantity}</span>
                </span>
                <span className="font-medium text-gulf-blue">
                  {formatKobo(item.unitPriceKobo * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="font-medium text-gray-700">Total</span>
            <span className="text-xl font-bold text-persian-blue">
              {formatKobo(order.totalKobo)}
            </span>
          </div>

          {order.address && (
            <div className="mt-6 border-t border-gray-100 pt-4 text-sm text-gray-600">
              <h3 className="font-medium text-gulf-blue">Shipping to</h3>
              <p className="mt-1">{order.address.fullName}</p>
              <p>{order.address.phone}</p>
              <p>{order.address.street}</p>
              <p>
                {order.address.city}, {order.address.state}
                {order.address.postalCode
                  ? ` ${order.address.postalCode}`
                  : ""}
              </p>
              <p>{order.address.country}</p>
            </div>
          )}
        </section>

        <section className="rounded-xl bg-brand-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gulf-blue">
            Order tracking
          </h2>
          <div className="mt-4">
            <StatusStepper
              currentStatus={order.status}
              history={order.statusHistory}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
