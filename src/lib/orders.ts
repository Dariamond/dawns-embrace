// Server-authoritative order logic: cart summarization, order creation,
// idempotent mark-paid, and admin-driven status transitions.
//
// SECURITY: product prices and stock are ALWAYS re-read from the DB here.
// Client-supplied prices are never trusted (design.md §5, §6). Prices are kobo.

import type { OrderStatus, Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { notify, notifyAdminNewOrder } from "@/lib/notify";

/** A line item as submitted by the client cart (productId + quantity only trusted). */
export type CartLineInput = {
  productId: string;
  quantity: number;
};

/** A server-recomputed line item with the authoritative price from the DB. */
export type OrderLine = {
  productId: string;
  nameSnapshot: string;
  unitPriceKobo: number;
  quantity: number;
  imageUrl: string;
  stock: number;
};

export type CartSummary = {
  lines: OrderLine[];
  totalKobo: number;
};

/**
 * Allowed status transitions (design.md §7). FEAT-005 reuses this map for the
 * admin status-advancement endpoint. CANCELLED is reachable from any active
 * (not-yet-terminal) status.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["APPROVED", "CANCELLED"],
  APPROVED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

/** Whether a transition from `from` to `to` is permitted. */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Re-reads product prices/stock from the DB for the given cart lines and
 * returns server-authoritative line items + total. Throws if a product is
 * missing/inactive. Does NOT enforce stock here (createOrder validates stock).
 */
export async function summarizeCart(
  items: CartLineInput[],
): Promise<CartSummary> {
  const normalized = items
    .filter((i) => i.productId && Number.isInteger(i.quantity) && i.quantity > 0)
    .map((i) => ({ productId: i.productId, quantity: i.quantity }));

  if (normalized.length === 0) {
    return { lines: [], totalKobo: 0 };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: normalized.map((i) => i.productId) }, isActive: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: OrderLine[] = normalized.map((item) => {
    const product = byId.get(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} is unavailable.`);
    }
    return {
      productId: product.id,
      nameSnapshot: product.name,
      unitPriceKobo: product.priceKobo,
      quantity: item.quantity,
      imageUrl: product.imageUrl,
      stock: product.stock,
    };
  });

  const totalKobo = lines.reduce(
    (sum, line) => sum + line.unitPriceKobo * line.quantity,
    0,
  );

  return { lines, totalKobo };
}

/**
 * Creates a PENDING order with price-snapshotted OrderItems. Prices/stock are
 * re-validated from the DB (never trusting the client). Throws on empty cart,
 * unavailable product, or insufficient stock.
 */
export async function createOrder(
  userId: string,
  items: CartLineInput[],
  addressId: string | null,
) {
  const { lines, totalKobo } = await summarizeCart(items);

  if (lines.length === 0) {
    throw new Error("Your cart is empty.");
  }

  for (const line of lines) {
    if (line.quantity > line.stock) {
      throw new Error(`Not enough stock for ${line.nameSnapshot}.`);
    }
  }

  return prisma.order.create({
    data: {
      userId,
      addressId: addressId ?? undefined,
      status: "PENDING",
      totalKobo,
      items: {
        create: lines.map((line) => ({
          productId: line.productId,
          nameSnapshot: line.nameSnapshot,
          unitPriceKobo: line.unitPriceKobo,
          quantity: line.quantity,
        })),
      },
      statusHistory: {
        create: { status: "PENDING" },
      },
    },
    include: { items: true },
  });
}

export type MarkPaidResult =
  | { ok: true; alreadyPaid: boolean; orderId: string }
  | { ok: false; error: string };

/**
 * Idempotently marks an order PAID from a verified Paystack reference. Both the
 * callback verify endpoint and the webhook converge here.
 *
 * - Guard: only acts when order.paidAt == null (idempotent; a second call is a
 *   no-op returning alreadyPaid=true).
 * - Asserts the paid amount covers order.totalKobo (anti-tampering).
 * - Sets status PAID + paidAt, appends an OrderStatusEvent(PAID), and decrements
 *   each product's stock — all in one transaction.
 * - After committing, notifies the customer + admin. Notification failures are
 *   swallowed inside notify()/notifyAdminNewOrder and never affect the result.
 */
export async function markOrderPaid(
  reference: string,
  paidAmountKobo: number,
): Promise<MarkPaidResult> {
  const order = await prisma.order.findUnique({
    where: { paystackRef: reference },
    include: { items: true },
  });

  if (!order) {
    return { ok: false, error: "Order not found for this reference." };
  }

  // Idempotency guard — already paid, do nothing.
  if (order.paidAt !== null) {
    return { ok: true, alreadyPaid: true, orderId: order.id };
  }

  if (paidAmountKobo < order.totalKobo) {
    return {
      ok: false,
      error: "Paid amount does not cover the order total.",
    };
  }

  // Mark paid + decrement stock atomically. A conditional update on
  // paidAt == null makes concurrent callers race-safe.
  const paidAt = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: order.id, paidAt: null },
        data: { status: "PAID", paidAt },
      });

      // Another caller won the race — bail without double-applying effects.
      if (updated.count === 0) {
        return;
      }

      await tx.orderStatusEvent.create({
        data: { orderId: order.id, status: "PAID" },
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    });
  } catch (error) {
    console.error("[orders] markOrderPaid transaction failed:", error);
    return { ok: false, error: "Failed to mark the order paid." };
  }

  // Re-read to confirm this call is the one that applied the PAID transition.
  const after = await prisma.order.findUnique({ where: { id: order.id } });
  if (after?.paidAt && after.paidAt.getTime() === paidAt.getTime()) {
    // Fire notifications (customer + admin). Failures are logged, not thrown.
    await notify(order.userId, {
      title: "Payment received",
      body: "We've received your payment and your order is now being processed.",
      orderId: order.id,
    });
    await notifyAdminNewOrder({
      id: order.id,
      totalKobo: order.totalKobo,
    });
    return { ok: true, alreadyPaid: false, orderId: order.id };
  }

  // Lost the race; another caller already applied it.
  return { ok: true, alreadyPaid: true, orderId: order.id };
}

export type AdvanceStatusResult =
  | { ok: true; status: OrderStatus }
  | { ok: false; error: string };

/**
 * Admin-driven status advancement (FEAT-005). Validates the transition against
 * ORDER_STATUS_TRANSITIONS, writes the new status, appends an
 * OrderStatusEvent, and fires a customer notification.
 */
export async function advanceStatus(
  orderId: string,
  next: OrderStatus,
  note?: string,
): Promise<AdvanceStatusResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return { ok: false, error: "Order not found." };
  }

  if (!canTransition(order.status, next)) {
    return {
      ok: false,
      error: `Cannot change status from ${order.status} to ${next}.`,
    };
  }

  const data: Prisma.OrderUpdateInput = { status: next };

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data });
    await tx.orderStatusEvent.create({
      data: { orderId, status: next, note: note ?? null },
    });
  });

  await notify(order.userId, {
    title: `Order ${next.toLowerCase()}`,
    body: `Your order status is now ${next}.`,
    orderId,
  });

  return { ok: true, status: next };
}
