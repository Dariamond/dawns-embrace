"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type VerifyState = "checking" | "success" | "invalid";

function VerifyInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const statusParam = searchParams.get("status");

  const [state, setState] = useState<VerifyState>(
    statusParam === "success"
      ? "success"
      : statusParam === "invalid"
        ? "invalid"
        : "checking",
  );

  // Resend form state.
  const [email, setEmail] = useState("");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // Only call the verify endpoint when we have a raw token and no status yet.
    if (!token || statusParam) {
      if (!token && !statusParam) {
        setState("invalid");
      }
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (cancelled) return;
        setState(res.ok ? "success" : "invalid");
      } catch {
        if (!cancelled) setState("invalid");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, statusParam]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setResending(true);
    setResendMessage(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResendMessage(
        data?.message ?? "If that account exists, a new email is on its way.",
      );
    } catch {
      setResendMessage("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-brand-white p-8 shadow-xl">
      {state === "checking" && (
        <>
          <h1 className="text-2xl font-semibold text-gulf-blue">
            Verifying your email…
          </h1>
          <p className="mt-2 text-sm text-gray-600">One moment please.</p>
        </>
      )}

      {state === "success" && (
        <>
          <h1 className="text-2xl font-semibold text-gulf-blue">
            Email verified
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Your account is ready. You can now sign in and check out.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-persian-blue px-5 py-2.5 font-medium text-brand-white transition hover:bg-gulf-blue"
          >
            Go to sign in
          </Link>
        </>
      )}

      {state === "invalid" && (
        <>
          <h1 className="text-2xl font-semibold text-gulf-blue">
            Link invalid or expired
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            This verification link is no longer valid. Enter your email to get a
            new one.
          </p>

          <form onSubmit={handleResend} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="resend-email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="resend-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-persian-blue focus:ring-2 focus:ring-persian-blue/30"
              />
            </div>

            {resendMessage && (
              <p className="rounded-lg bg-persian-blue/10 px-3 py-2 text-sm text-gulf-blue">
                {resendMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={resending}
              className="w-full rounded-lg bg-persian-blue py-2.5 font-medium text-brand-white transition hover:bg-gulf-blue disabled:opacity-60"
            >
              {resending ? "Sending…" : "Resend verification email"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gulf-blue px-4 py-16">
      <Suspense fallback={null}>
        <VerifyInner />
      </Suspense>
    </main>
  );
}
