"use client";

// Admin create-product form. Flow:
//   1. User picks an image file.
//   2. On submit we fetch signed params from /api/uploads, then upload the file
//      DIRECTLY to Cloudinary (so the file never passes through our server).
//   3. We POST the resulting secure_url + public_id (plus the product fields)
//      to /api/products to create the Product.
// On success it refreshes the server component list so the new product appears.

import { useRouter } from "next/navigation";
import { useState } from "react";

type Fields = {
  name: string;
  description: string;
  dialColor: string;
  priceNaira: string;
  stock: string;
};

const EMPTY: Fields = {
  name: "",
  description: "",
  dialColor: "",
  priceNaira: "",
  stock: "",
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
};

export function ProductForm() {
  const router = useRouter();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update(field: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
  }

  async function uploadToCloudinary(image: File): Promise<{
    imageUrl: string;
    imagePublicId: string;
  }> {
    // 1. Get signed params from our server (admin-gated).
    const signRes = await fetch("/api/uploads", { method: "POST" });
    const sign = await signRes.json();
    if (!signRes.ok) {
      throw new Error(sign?.error ?? "Could not authorize image upload.");
    }

    // 2. Upload directly to Cloudinary with the signed params.
    const form = new FormData();
    form.append("file", image);
    form.append("api_key", sign.apiKey);
    form.append("timestamp", String(sign.timestamp));
    form.append("signature", sign.signature);
    form.append("folder", sign.folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
      { method: "POST", body: form },
    );
    const uploaded: CloudinaryUploadResponse = await uploadRes.json();
    if (!uploadRes.ok || !uploaded.secure_url || !uploaded.public_id) {
      throw new Error(uploaded.error?.message ?? "Image upload failed.");
    }

    return {
      imageUrl: uploaded.secure_url,
      imagePublicId: uploaded.public_id,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const priceNaira = Number(fields.priceNaira);
    const stock = Number(fields.stock);
    if (!Number.isFinite(priceNaira) || priceNaira <= 0) {
      setError("Enter a valid price.");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Enter a valid stock quantity.");
      return;
    }
    if (!file) {
      setError("Choose a product image.");
      return;
    }

    setSubmitting(true);
    try {
      const { imageUrl, imagePublicId } = await uploadToCloudinary(file);

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.name,
          description: fields.description,
          dialColor: fields.dialColor,
          // Prices are stored as integer kobo (NGN minor unit).
          priceKobo: Math.round(priceNaira * 100),
          stock,
          imageUrl,
          imagePublicId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not create product.");
      }

      setFields(EMPTY);
      setFile(null);
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextField
        id="name"
        label="Name"
        value={fields.name}
        onChange={(v) => update("name", v)}
      />
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          required
          rows={3}
          value={fields.description}
          onChange={(e) => update("description", e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-persian-blue focus:ring-2 focus:ring-persian-blue/30"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField
          id="dialColor"
          label="Dial color"
          value={fields.dialColor}
          onChange={(v) => update("dialColor", v)}
        />
        <TextField
          id="price"
          label="Price (₦)"
          type="number"
          value={fields.priceNaira}
          onChange={(v) => update("priceNaira", v)}
        />
      </div>
      <TextField
        id="stock"
        label="Stock"
        type="number"
        value={fields.stock}
        onChange={(v) => update("stock", v)}
      />
      <div>
        <label
          htmlFor="image"
          className="block text-sm font-medium text-gray-700"
        >
          Product image
        </label>
        <input
          id="image"
          type="file"
          accept="image/*"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gulf-blue file:px-3 file:py-2 file:text-brand-white"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Product added.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-persian-blue py-3 font-medium text-brand-white transition hover:bg-gulf-blue disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Add product"}
      </button>
    </form>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        step={type === "number" ? "any" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-persian-blue focus:ring-2 focus:ring-persian-blue/30"
      />
    </div>
  );
}
