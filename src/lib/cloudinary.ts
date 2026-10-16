// Cloudinary integration for admin product image uploads.
//
// Uploads are performed directly from the admin client to Cloudinary using
// SIGNED params generated here on the server (so API_SECRET never reaches the
// browser). The client posts the file + {timestamp, signature, apiKey, folder}
// to Cloudinary's upload endpoint; Cloudinary validates the signature.

import { v2 as cloudinary } from "cloudinary";

import { env } from "@/lib/env";

/** The Cloudinary folder all Dawns Embrace product images live under. */
const UPLOAD_FOLDER = "dawns-embrace/products";

let configured = false;

/** Configure the Cloudinary SDK once from env (lazy, so build-time imports are safe). */
function configure() {
  if (configured) {
    return;
  }
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
  configured = true;
}

export type SignedUploadParams = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
};

/**
 * Returns signed params for a direct (client-side) Cloudinary upload. The
 * signature covers exactly the params the client must send back verbatim
 * (here: folder + timestamp), per Cloudinary's signed-upload contract.
 */
export function signUploadParams(): SignedUploadParams {
  configure();

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { folder: UPLOAD_FOLDER, timestamp },
    env.cloudinaryApiSecret,
  );

  return {
    timestamp,
    signature,
    apiKey: env.cloudinaryApiKey,
    cloudName: env.cloudinaryCloudName,
    folder: UPLOAD_FOLDER,
  };
}

/**
 * Deletes an uploaded image by its Cloudinary public id. Best-effort: errors
 * are logged and swallowed so a failed cleanup never blocks the product op.
 */
export async function deleteImage(publicId: string): Promise<void> {
  if (!publicId) {
    return;
  }
  try {
    configure();
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`[cloudinary] failed to delete ${publicId}:`, error);
  }
}
