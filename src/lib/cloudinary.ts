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

/** The Cloudinary folder all Dawns Embrace videos live under. */
const VIDEO_FOLDER = "dawns-embrace/videos";

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

/**
 * Cloudinary resource type. "image" and "video" map to Cloudinary's upload
 * endpoints and delete resource types. (Cloudinary serves audio under "video".)
 */
export type MediaType = "image" | "video";

export type SignedUploadParams = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  /** Which Cloudinary endpoint the client should upload to. */
  resourceType: MediaType;
};

/**
 * Returns signed params for a direct (client-side) Cloudinary upload. The
 * signature covers exactly the params the client must send back verbatim
 * (here: folder + timestamp), per Cloudinary's signed-upload contract.
 *
 * `resourceType` selects the folder and the endpoint the client posts to:
 * image → .../image/upload, video → .../video/upload. The signed params
 * themselves are the same; the resource type is an endpoint/path choice, not
 * part of the signature here.
 */
export function signUploadParams(
  resourceType: MediaType = "image",
): SignedUploadParams {
  configure();

  const folder =
    resourceType === "video" ? VIDEO_FOLDER : UPLOAD_FOLDER;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    env.cloudinaryApiSecret,
  );

  return {
    timestamp,
    signature,
    apiKey: env.cloudinaryApiKey,
    cloudName: env.cloudinaryCloudName,
    folder,
    resourceType,
  };
}

/**
 * Deletes an uploaded asset by its Cloudinary public id. `resourceType` must
 * match how the asset was stored ("video" for videos — the default "image"
 * will not delete a video). Best-effort: errors are logged and swallowed so a
 * failed cleanup never blocks the product op.
 */
export async function deleteAsset(
  publicId: string,
  resourceType: MediaType = "image",
): Promise<void> {
  if (!publicId) {
    return;
  }
  try {
    configure();
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error(
      `[cloudinary] failed to delete ${resourceType} ${publicId}:`,
      error,
    );
  }
}

/** @deprecated Use deleteAsset(publicId, "image"). Kept for existing callers. */
export async function deleteImage(publicId: string): Promise<void> {
  return deleteAsset(publicId, "image");
}
