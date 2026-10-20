// POST /api/uploads — return signed Cloudinary upload params for the admin.
// Role-gated via requireAdmin() (returns 403 for non-admins).

import { NextResponse } from "next/server";

import { signUploadParams, type MediaType } from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Optional body: { resourceType: "image" | "video" }. Defaults to image.
  let resourceType: MediaType = "image";
  try {
    const body = (await req.json()) as { resourceType?: unknown };
    if (body?.resourceType === "video") {
      resourceType = "video";
    }
  } catch {
    // No/invalid body — keep the image default.
  }

  try {
    const params = signUploadParams(resourceType);
    return NextResponse.json(params);
  } catch (error) {
    console.error("[uploads] failed to sign upload params:", error);
    return NextResponse.json(
      { error: "Media uploads are not configured." },
      { status: 500 },
    );
  }
}
