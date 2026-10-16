"use client";

// A single row in the admin product list with inline edit (name / price / stock)
// and a deactivate (soft-delete) action. Edits PATCH /api/products/[id]; both
// actions refresh the server component list on success.

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatKobo } from "@/lib/money";

export type AdminProduct = {
  id: string;
  name: string;
  dialColor: string;
  priceKobo: number;
  stock: number;
  isActive: boolean;
};

export function ProductRow({ product }: { product: AdminProduct }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [priceNaira, setPriceNaira] = useState(
    (product.priceKobo / 100).toString(),
  );
  const [stock, setStock] = useState(product.stock.toString());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    const price = Number(priceNaira);
    const stockNum = Number(stock);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Invalid price.");
      return;
    }
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      setError("Invalid stock.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          priceKobo: Math.round(price * 100),
          stock: stockNum,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Update failed.");
      }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not deactivate.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not deactivate.");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <tr className="border-t border-gray-100">
        <td className="px-4 py-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-900"
          />
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">{product.dialColor}</td>
        <td className="px-4 py-3">
          <input
            type="number"
            step="any"
            value={priceNaira}
            onChange={(e) => setPriceNaira(e.target.value)}
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900"
          />
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="rounded bg-persian-blue px-3 py-1 text-xs font-medium text-brand-white disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={busy}
              className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600"
            >
              Cancel
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-3 text-sm font-medium text-gulf-blue">
        {product.name}
        {!product.isActive && (
          <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">
            inactive
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{product.dialColor}</td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {formatKobo(product.priceKobo)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">{product.stock}</td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gulf-blue"
          >
            Edit
          </button>
          {product.isActive && (
            <button
              type="button"
              onClick={deactivate}
              disabled={busy}
              className="rounded border border-red-200 px-3 py-1 text-xs font-medium text-red-600 disabled:opacity-60"
            >
              Deactivate
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
