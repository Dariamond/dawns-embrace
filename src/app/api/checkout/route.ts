// POST /api/checkout — gate (session AND emailVerified), create a PENDING order
// with server-recomputed totals, init a Paystack transaction, save the ref, and
// return the hosted authorization_url for redirect.

import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { createOrder, type CartLineInput } from "@/lib/orders";
import { initTransaction } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type CheckoutBody = {
  items?: unknown;
  addressId?: unknown;
};

function parseItems(raw: unknown): CartLineInput[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const productId = (entry as { productId?: unknown }).productId;
      const quantity = (entry as { quantity?: unknown }).quantity;
      if (typeof productId !== "string" || typeof quantity !== "number") {
        return null;
      }
      return { productId, quantity };
    })
    .filter((i): i is CartLineInput => i !== null);
}

export async function POST(req: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Checkout gate: session AND emailVerified != null. emailVerified is not on
  // the JWT/session, so re-fetch it from the DB.
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, emailVerified: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (user.emailVerified === null) {
    return NextResponse.json(
      { error: "Please verify your email before checking out." },
      { status: 403 },
    );
  }

  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const items = parseItems(body.items);
  if (items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const addressId =
    typeof body.addressId === "string" && body.addressId ? body.addressId : null;

  // Validate the address belongs to this user (if provided).
  if (addressId) {
    const owned = await prisma.address.findFirst({
      where: { id: addressId, userId: user.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json(
        { error: "Invalid shipping address." },
        { status: 400 },
      );
    }
  }

  // Create the order with server-recomputed prices/totals (never trusts client).
  let order;
  try {
    order = await createOrder(user.id, items, addressId);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create order.",
      },
      { status: 400 },
    );
  }

  const reference = `DE-${order.id}-${randomUUID()}`;

  const init = await initTransaction({
    email: user.email,
    amountKobo: order.totalKobo,
    reference,
    metadata: { orderId: order.id },
  });

  if (!init.ok) {
    return NextResponse.json({ error: init.error }, { status: 502 });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { paystackRef: init.reference },
  });

  return NextResponse.json({
    orderId: order.id,
    authorizationUrl: init.authorizationUrl,
    reference: init.reference,
    publicKey: env.optional("PAYSTACK_PUBLIC_KEY") ?? null,
  });
}
