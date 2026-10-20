"use client";

// Admin intro-video manager. Flow mirrors the product image upload:
//   1. Ask /api/uploads for SIGNED params with resourceType "video".
//   2. Upload the file DIRECTLY to Cloudinary's /video/upload endpoint.
//   3. POST the resulting secure_url + public_id to /api/admin/intro-video.
// Also supports previewing the current video and removing it.

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
};

// Cloudinary's free plan caps unsigned/basic uploads at 100MB; keep intro
// videos well under that for fast loads.
const MAX_BYTES = 80 * 1024 * 1024; // 80 MB

export function IntroVideoForm({ currentUrl }: { currentUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function uploadVideo(video: File): Promise<{
    url: string;
    publicId: string;
  }> {
    const signRes = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceType: "video" }),
    });
    const sign = await signRes.json();
    if (!signRes.ok) {
      throw new Error(sign?.error ?? "Could not authorize the video upload.");
    }

    const form = new FormData();
    form.append("file", video);
    form.append("api_key", sign.apiKey);
    form.append("timestamp", String(sign.timestamp));
    form.append("signature", sign.signature);
    form.append("folder", sign.folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${sign.cloudName}/video/upload`,
      { method: "POST", body: form },
    );
    const uploaded: CloudinaryUploadResponse = await uploadRes.json();
    if (!uploadRes.ok || !uploaded.secure_url || !uploaded.public_id) {
      throw new Error(uploaded.error?.message ?? "Video upload failed.");
    }
    return { url: uploaded.secure_url, publicId: uploaded.public_id };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError("Choose a video file.");
      return;
    }
    if (!file.type.startsWith("video/")) {
      setError("That file isn’t a video.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Video is too large. Keep it under 80 MB.");
      return;
    }

    setBusy(true);
    try {
      const { url, publicId } = await uploadVideo(file);
      const res = await fetch("/api/admin/intro-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, publicId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not save the intro video.");
      }
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setSuccess("Intro video saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/intro-video", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not remove the intro video.");
      }
      setSuccess("Intro video removed. Customers now go straight to the shop.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {currentUrl ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Current video</p>
          <video
            src={currentUrl}
            controls
            playsInline
            className="w-full rounded-lg border border-gray-200 bg-black"
          />
        </div>
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No intro video set — customers go straight to the shop.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="intro-video"
            className="block text-sm font-medium text-gray-700"
          >
            {currentUrl ? "Replace video" : "Upload video"}
          </label>
          <input
            ref={inputRef}
            id="intro-video"
            type="file"
            accept="video/*"
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
            {success}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-persian-blue px-5 py-2.5 text-sm font-medium text-brand-white transition hover:bg-gulf-blue disabled:opacity-60"
          >
            {busy ? "Working…" : currentUrl ? "Replace video" : "Save video"}
          </button>
          {currentUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="rounded-lg border border-red-300 px-5 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
            >
              Remove
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
