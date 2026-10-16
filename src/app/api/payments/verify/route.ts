// GET /api/payments/verify?reference=... — server-side Paystack verify. On a
// successful transaction whose amount covers the order total, converge on the
// shared idempotent markOrderPaid. The webhook is the other path into the same
// routine (design.md §6).

import { NextResponse } from "next/server";

import { markOrderPaid } from "@/lib/orders";
import { verifyTransaction } from "@/lib/paystack";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference")?.trim();

  if (!reference) {
    return NextResponse.json(
      { error: "Missing payment reference." },
      { status: 400 },
    );
  }

  const verification = await verifyTransaction(reference);
  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: 502 });
  }

  if (verification.status !== "success") {
    return NextResponse.json(
      { status: verification.status, paid: false },
      { status: 200 },
    );
  }

  // markOrderPaid is idempotent and re-checks the amount vs order.totalKobo.
  const result = await markOrderPaid(reference, verification.amountKobo);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    status: "success",
    paid: true,
    orderId: result.orderId,
    alreadyPaid: result.alreadyPaid,
  });
}
