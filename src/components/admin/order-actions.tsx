"use client";

// Admin status-advancement controls for one order. Renders a button for each
// allowed next status (passed from the server, computed via the transition
// map) that POSTs to /api/orders/[id]/status and refreshes on success.

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrderActions({
  orderId,
  nextStatuses,
}: {
  orderId: string;
  nextStatuses: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function advance(status: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not update status.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setBusy(false);
    }
  }

  if (nextStatuses.length === 0) {
    return <p className="text-xs text-gray-400">No further actions.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((status) => {
          const isCancel = status === "CANCELLED";
          return (
            <button
              key={status}
              type="button"
              onClick={() => advance(status)}
              disabled={busy}
              className={`rounded px-3 py-1 text-xs font-medium disabled:opacity-60 ${
                isCancel
                  ? "border border-red-200 text-red-600"
                  : "bg-persian-blue text-brand-white"
              }`}
            >
              {isCancel ? "Cancel" : `Mark ${status.toLowerCase()}`}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
