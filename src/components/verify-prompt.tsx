"use client";

// Resend-verification prompt used on the checkout gate for authenticated but
// unverified users. Posts to the existing /api/auth/resend-verification route.

import { useState } from "react";

export function VerifyPrompt({ email }: { email: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleResend() {
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(
        data?.message ?? "If that account exists, a new email is on its way.",
      );
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleResend}
        disabled={sending}
        className="rounded-lg bg-persian-blue px-5 py-2.5 font-medium text-brand-white transition hover:bg-gulf-blue disabled:opacity-60"
      >
        {sending ? "Sending…" : "Resend verification email"}
      </button>
      {message && (
        <p className="rounded-lg bg-persian-blue/10 px-3 py-2 text-sm text-gulf-blue">
          {message}
        </p>
      )}
    </div>
  );
}
