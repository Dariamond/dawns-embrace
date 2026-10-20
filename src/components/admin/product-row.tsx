"use client";

// A single row in the admin product list with inline edit (name / price / stock),
// image management (thumbnail, replace main image, add/remove sub-images), a
// deactivate (soft-delete) action, and a permanent (hard) delete action. Edits
// PATCH /api/products/[id]; actions refresh the server component list on success.

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { formatKobo } from "@/lib/money";
import { uploadImageToCloudinary } from "@/lib/upload-image";

export type AdminProduct = {
  id: string;
  name: string;
  dialColor: string;
  priceKobo: number;
  stock: number;
  isActive: boolean;
  imageUrl: string;
  imagePublicId: string | null;
  images: { id: string; url: string }[];
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
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const subImageInputRef = useRef<HTMLInputElement>(null);

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

  async function replaceMainImage(file: File) {
    setError(null);
    setBusy(true);
    try {
      const { url, publicId } = await uploadImageToCloudinary(file);
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url, imagePublicId: publicId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not replace image.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not replace image.");
    } finally {
      setBusy(false);
      if (mainImageInputRef.current) mainImageInputRef.current.value = "";
    }
  }

  async function addSubImage(file: File) {
    setError(null);
    setBusy(true);
    try {
      const { url, publicId } = await uploadImageToCloudinary(file);
      const res = await fetch(`/api/products/${product.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, publicId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not add image.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add image.");
    } finally {
      setBusy(false);
      if (subImageInputRef.current) subImageInputRef.current.value = "";
    }
  }

  async function removeSubImage(imageId: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(
        `/api/products/${product.id}/images/${imageId}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not remove image.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove image.");
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

  async function hardDelete() {
    if (
      !window.confirm(
        "Permanently delete this product? This cannot be undone.",
      )
    ) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${product.id}?mode=hard`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not delete product.");
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete product.",
      );
    } finally {
      setBusy(false);
    }
  }

  const thumbnail = (
    <Image
      src={product.imageUrl}
      alt={product.name}
      width={48}
      height={48}
      className="h-12 w-12 rounded-lg object-cover"
    />
  );

  if (editing) {
    return (
      <tr className="border-t border-gray-100 align-top">
        <td className="px-4 py-3">
          <div className="space-y-2">
            {thumbnail}
            <div>
              <button
                type="button"
                onClick={() => mainImageInputRef.current?.click()}
                disabled={busy}
                className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gulf-blue disabled:opacity-60"
              >
                Replace image
              </button>
              <input
                ref={mainImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) replaceMainImage(f);
                }}
              />
            </div>
            <div className="space-y-1">
              {product.images.map((img) => (
                <div key={img.id} className="flex items-center gap-2">
                  <Image
                    src={img.url}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeSubImage(img.id)}
                    disabled={busy}
                    className="text-xs font-medium text-red-600 disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => subImageInputRef.current?.click()}
                disabled={busy}
                className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gulf-blue disabled:opacity-60"
              >
                Add image
              </button>
              <input
                ref={subImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) addSubImage(f);
                }}
              />
            </div>
          </div>
        </td>
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
      <td className="px-4 py-3">{thumbnail}</td>
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
          <button
            type="button"
            onClick={hardDelete}
            disabled={busy}
            className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-brand-white disabled:opacity-60"
          >
            Delete permanently
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
