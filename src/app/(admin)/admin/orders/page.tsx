// Admin order list: every order with customer, items, total, shipping address,
// and current status, plus buttons to advance/cancel. Allowed next statuses are
// computed server-side from ORDER_STATUS_TRANSITIONS so the UI never offers an
// invalid transition (the API re-validates regardless).

import { formatKobo } from "@/lib/money";
import { ORDER_STATUS_TRANSITIONS } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

import { OrderActions } from "@/components/admin/order-actions";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      address: true,
      user: { select: { email: true, name: true } },
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gulf-blue">Orders</h1>
      <p className="mt-1 text-sm text-gray-500">
        Review orders and advance their status. Each change notifies the
        customer.
      </p>

      {orders.length === 0 ? (
        <p className="mt-8 rounded-xl bg-brand-white p-6 text-sm text-gray-500 shadow-sm">
          No orders yet.
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-xl bg-brand-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gulf-blue">
                    Order {order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.user.name
                      ? `${order.user.name} · `
                      : ""}
                    {order.user.email}
                  </p>
                  <p className="text-xs text-gray-400">
                    Placed {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-full bg-gulf-blue/10 px-3 py-1 text-xs font-semibold text-gulf-blue">
                    {order.status}
                  </span>
                  <p className="mt-1 text-sm font-bold text-persian-blue">
                    {formatKobo(order.totalKobo)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Items
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {order.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-4"
                      >
                        <span>
                          {item.nameSnapshot}
                          <span className="text-gray-400">
                            {" "}
                            × {item.quantity}
                          </span>
                        </span>
                        <span className="text-gray-500">
                          {formatKobo(item.unitPriceKobo * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Shipping
                  </h3>
                  {order.address ? (
                    <address className="mt-2 text-sm not-italic text-gray-600">
                      {order.address.fullName}
                      <br />
                      {order.address.phone}
                      <br />
                      {order.address.street}
                      <br />
                      {order.address.city}, {order.address.state}
                      {order.address.postalCode
                        ? ` ${order.address.postalCode}`
                        : ""}
                      <br />
                      {order.address.country}
                    </address>
                  ) : (
                    <p className="mt-2 text-sm text-gray-400">
                      No address on file.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4">
                <OrderActions
                  orderId={order.id}
                  nextStatuses={ORDER_STATUS_TRANSITIONS[order.status]}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
