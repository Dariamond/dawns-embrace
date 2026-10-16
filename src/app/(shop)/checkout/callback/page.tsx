"use client";

// Paystack redirects here after the hosted checkout. We read ?reference and call
// the server-side verify endpoint. Success -> link to the order. Failure/abandon
// leaves the order PENDING and offers a retry link back to checkout.

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type CallbackState =
  | { kind: "checking" }
  | { kind: "success"; orderId?: string }
  | { kind: "pending" }
  | { kind: "error"; message: string };

function CallbackInner() {
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("reference") ?? searchParams.get("trxref") ?? "";

  const [state, setState] = useState<CallbackState>({ kind: "checking" });

  useEffect(() => {
    if (!reference) {
      setState({ kind: "error", message: "No payment reference was provided." });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/payments/verify?reference=${encodeURIComponent(reference)}`,
        );
        const data = await res.json();
        if (cancelled) return;

        if (res.ok && data?.paid) {
          setState({ kind: "success", orderId: data.orderId });
        } else if (res.ok && !data?.paid) {
          setState({ kind: "pending" });
        } else {
          setState({
            kind: "error",
            message: data?.error ?? "We couldn't verify your payment.",
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            kind: "error",
            message: "Network error while verifying payment.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-2xl bg-brand-white p-8 shadow-sm">
        {state.kind === "checking" && (
          <>
            <h1 className="text-2xl font-semibold text-gulf-blue">
              Confirming your payment…
            </h1>
            <p className="mt-2 text-sm text-gray-600">One moment please.</p>
          </>
        )}

        {state.kind === "success" && (
          <>
            <h1 className="text-2xl font-semibold text-gulf-blue">
              Payment received
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Thank you. Your order is now being processed. We&apos;ll email you
              as its status changes.
            </p>
            <div className="mt-6 flex gap-3">
              {state.orderId ? (
                <Link
                  href={`/orders/${state.orderId}`}
                  className="rounded-lg bg-persian-blue px-5 py-2.5 font-medium text-brand-white transition hover:bg-gulf-blue"
                >
                  View order
                </Link>
              ) : (
                <Link
                  href="/orders"
                  className="rounded-lg bg-persian-blue px-5 py-2.5 font-medium text-brand-white transition hover:bg-gulf-blue"
                >
                  View my orders
                </Link>
              )}
            </div>
          </>
        )}

        {state.kind === "pending" && (
          <>
            <h1 className="text-2xl font-semibold text-gulf-blue">
              Payment not completed
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Your payment wasn&apos;t completed. Your order is still pending —
              you can try again.
            </p>
            <div className="mt-6">
              <Link
                href="/checkout"
                className="rounded-lg bg-persian-blue px-5 py-2.5 font-medium text-brand-white transition hover:bg-gulf-blue"
              >
                Try again
              </Link>
            </div>
          </>
        )}

        {state.kind === "error" && (
          <>
            <h1 className="text-2xl font-semibold text-gulf-blue">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-gray-600">{state.message}</p>
            <div className="mt-6">
              <Link
                href="/checkout"
                className="rounded-lg bg-persian-blue px-5 py-2.5 font-medium text-brand-white transition hover:bg-gulf-blue"
              >
                Back to checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function CheckoutCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
