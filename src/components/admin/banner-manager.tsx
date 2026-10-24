"use client";

// Admin banner manager for the shop carousel. Mirrors the intro-video form UX:
//   - Upload a new banner image via the shared signed Cloudinary flow, then
//     POST it to /api/admin/banners (optionally with a destination link).
//   - List each banner with a thumbnail, active state, and link.
//   - Reorder (move up/down) by swapping sortOrder with the neighbour.
//   - Toggle active/inactive, edit the link, or delete.
// Every mutation calls router.refresh() to re-pull the server-rendered list.

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { uploadImageToCloudinary } from "@/lib/upload-image";

type BannerItem = {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

export function BannerManager({ banners }: { banners: BannerItem[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [newLink, setNewLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError("Choose an image file.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("That file isn’t an image.");
      return;
    }

    setBusy(true);
    try {
      const { url, publicId } = await uploadImageToCloudinary(file);
      const link = newLink.trim();
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: url,
          publicId,
          ...(link ? { linkUrl: link } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not save the banner.");
      }
      setFile(null);
      setNewLink("");
      if (inputRef.current) inputRef.current.value = "";
      setSuccess("Banner added.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function patchBanner(id: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/admin/banners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await res.json();
    if (!res.ok) {
      throw new Error(payload?.error ?? "Could not update the banner.");
    }
  }

  async function handleToggle(banner: BannerItem) {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await patchBanner(banner.id, { isActive: !banner.isActive });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMove(index: number, dir: -1 | 1) {
    const target = banners[index + dir];
    const current = banners[index];
    if (!target || !current) return;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      // Swap the two banners' sortOrder values.
      await patchBanner(current.id, { sortOrder: target.sortOrder });
      await patchBanner(target.id, { sortOrder: current.sortOrder });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleEditLink(banner: BannerItem) {
    const input = window.prompt(
      "Destination link for this banner (leave blank to clear):",
      banner.linkUrl ?? "",
    );
    if (input === null) return; // cancelled
    const trimmed = input.trim();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await patchBanner(banner.id, { linkUrl: trimmed ? trimmed : null });
      setSuccess(trimmed ? "Link updated." : "Link cleared.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(banner: BannerItem) {
    if (!window.confirm("Delete this banner? This cannot be undone.")) return;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not delete the banner.");
      }
      setSuccess("Banner deleted.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label
            htmlFor="banner-image"
            className="block text-sm font-medium text-gray-700"
          >
            Add banner image
          </label>
          <input
            ref={inputRef}
            id="banner-image"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gulf-blue file:px-3 file:py-2 file:text-brand-white"
          />
        </div>

        <div>
          <label
            htmlFor="banner-link"
            className="block text-sm font-medium text-gray-700"
          >
            Destination link (optional)
          </label>
          <input
            id="banner-link"
            type="url"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            placeholder="https://example.com/sale"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-persian-blue focus:ring-2 focus:ring-persian-blue/30"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-persian-blue px-5 py-2.5 text-sm font-medium text-brand-white transition hover:bg-gulf-blue disabled:opacity-60"
        >
          {busy ? "Working…" : "Add banner"}
        </button>
      </form>

      {banners.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No banners yet — add one above to show a carousel on the shop page.
        </p>
      ) : (
        <ul className="space-y-3">
          {banners.map((banner, index) => (
            <li
              key={banner.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
            >
              <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={banner.imageUrl}
                  alt="Banner preview"
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {banner.isActive ? "Active" : "Inactive"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {banner.linkUrl ? banner.linkUrl : "No link"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMove(index, -1)}
                  disabled={busy || index === 0}
                  aria-label="Move up"
                  className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 1)}
                  disabled={busy || index === banners.length - 1}
                  aria-label="Move down"
                  className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(banner)}
                  disabled={busy}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  {banner.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => handleEditLink(banner)}
                  disabled={busy}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  Edit link
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(banner)}
                  disabled={busy}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
