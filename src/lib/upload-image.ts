// Client-side Cloudinary upload helper. Implements the signed direct-upload flow:
//   1. POST /api/uploads to get signed params (admin-gated).
//   2. Upload the file DIRECTLY to Cloudinary (the file never passes through our server).
//   3. Return the resulting secure_url + public_id.
// Shared by the create form and the admin product row so the flow lives in one place.

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
};

export async function uploadImageToCloudinary(
  file: File,
): Promise<{ url: string; publicId: string }> {
  // 1. Get signed params from our server (admin-gated).
  const signRes = await fetch("/api/uploads", { method: "POST" });
  const sign = await signRes.json();
  if (!signRes.ok) {
    throw new Error(sign?.error ?? "Could not authorize image upload.");
  }

  // 2. Upload directly to Cloudinary with the signed params.
  const form = new FormData();
  form.append("file", file);
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
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
  };
}
