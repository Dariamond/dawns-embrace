// Paystack REST client (test mode now, live later via env). Amounts are in kobo.
// All calls use the secret key server-side only (design.md §6, §10).

import { env } from "@/lib/env";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export type InitTransactionInput = {
  email: string;
  amountKobo: number;
  reference: string;
  metadata?: Record<string, unknown>;
};

export type InitTransactionResult =
  | { ok: true; authorizationUrl: string; reference: string }
  | { ok: false; error: string };

export type VerifyTransactionResult =
  | { ok: true; status: string; amountKobo: number; reference: string }
  | { ok: false; error: string };

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${env.paystackSecretKey}`,
    "Content-Type": "application/json",
  };
}

/**
 * Initializes a Paystack transaction. Returns the hosted checkout
 * authorization_url and the reference to redirect the customer to.
 */
export async function initTransaction(
  input: InitTransactionInput,
): Promise<InitTransactionResult> {
  try {
    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        email: input.email,
        amount: input.amountKobo, // kobo
        reference: input.reference,
        metadata: input.metadata ?? {},
      }),
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok || !data?.status || !data?.data?.authorization_url) {
      return {
        ok: false,
        error: data?.message ?? "Failed to initialize payment.",
      };
    }

    return {
      ok: true,
      authorizationUrl: data.data.authorization_url as string,
      reference: (data.data.reference as string) ?? input.reference,
    };
  } catch (error) {
    console.error("[paystack] initTransaction threw:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown Paystack error.",
    };
  }
}

/**
 * Verifies a transaction by reference. Returns the Paystack status (e.g.
 * "success") and the amount actually paid (kobo).
 */
export async function verifyTransaction(
  reference: string,
): Promise<VerifyTransactionResult> {
  try {
    const res = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: authHeaders(),
        cache: "no-store",
      },
    );

    const data = await res.json();
    if (!res.ok || !data?.status || !data?.data) {
      return {
        ok: false,
        error: data?.message ?? "Failed to verify payment.",
      };
    }

    return {
      ok: true,
      status: data.data.status as string,
      amountKobo: Number(data.data.amount),
      reference: data.data.reference as string,
    };
  } catch (error) {
    console.error("[paystack] verifyTransaction threw:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown Paystack error.",
    };
  }
}
