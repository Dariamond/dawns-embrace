// POST /api/payments/webhook — Paystack server-to-server webhook (the source of
// truth, design.md §6). Validates the x-paystack-signature as an HMAC-SHA512 of
// the RAW request body with PAYSTACK_SECRET_KEY, compared timing-safe. On
// charge.success it converges on the shared idempotent markOrderPaid.

import { createHmac, timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { markOrderPaid } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Timing-safe comparison of two hex signature strings. */
function signaturesMatch(expectedHex: string, providedHex: string): boolean {
  const expected = Buffer.from(expectedHex, "hex");
  const provided = Buffer.from(providedHex, "hex");
  if (expected.length !== provided.length || expected.length === 0) {
    return false;
  }
  return timingSafeEqual(expected, provided);
}

export async function POST(req: Request) {
  // Read the RAW body — the signature is computed over these exact bytes.
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 401 });
  }

  const expected = createHmac("sha512", env.paystackSecretKey)
    .update(rawBody)
    .digest("hex");

  if (!signaturesMatch(expected, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string; amount?: number } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    // Signature was valid but body isn't JSON — ack to stop retries.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    const reference = event.data.reference;
    const amountKobo = Number(event.data.amount ?? 0);
    const result = await markOrderPaid(reference, amountKobo);
    if (!result.ok) {
      // Log for diagnostics but still ack: Paystack retries don't help here.
      console.error(
        `[webhook] markOrderPaid failed for ${reference}: ${result.error}`,
      );
    }
  }

  // Always ack quickly after signature validation.
  return NextResponse.json({ received: true }, { status: 200 });
}
