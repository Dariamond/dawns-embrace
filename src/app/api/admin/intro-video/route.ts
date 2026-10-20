// Admin-only API to manage the intro video setting.
//   POST   { url, publicId } → set/replace the intro video
//   DELETE                   → clear the intro video
// The admin client uploads the video file DIRECTLY to Cloudinary (signed via
// /api/uploads with resourceType "video"), then posts the resulting secure_url
// + public_id here. On replace/clear we delete the previous Cloudinary asset.

import { NextResponse } from "next/server";

import { deleteAsset } from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/session";
import {
  clearIntroVideo,
  getIntroVideo,
  setIntroVideo,
} from "@/lib/site-settings";

export const dynamic = "force-dynamic";

async function requireAdminUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  if (user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const gate = await requireAdminUser();
  if (gate.error) return gate.error;

  const intro = await getIntroVideo();
  return NextResponse.json({ intro });
}

export async function POST(req: Request) {
  const gate = await requireAdminUser();
  if (gate.error) return gate.error;

  let body: { url?: unknown; publicId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  const publicId =
    typeof body.publicId === "string" && body.publicId.trim()
      ? body.publicId.trim()
      : null;

  if (!url || !/^https:\/\/res\.cloudinary\.com\//.test(url)) {
    return NextResponse.json(
      { error: "A valid Cloudinary video URL is required." },
      { status: 400 },
    );
  }

  const { previousPublicId } = await setIntroVideo(url, publicId);

  // Best-effort cleanup of the replaced video (never blocks the save).
  if (previousPublicId && previousPublicId !== publicId) {
    await deleteAsset(previousPublicId, "video");
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const gate = await requireAdminUser();
  if (gate.error) return gate.error;

  const { removedPublicId } = await clearIntroVideo();
  if (removedPublicId) {
    await deleteAsset(removedPublicId, "video");
  }
  return NextResponse.json({ ok: true });
}
