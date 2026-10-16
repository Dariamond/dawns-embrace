// POST /api/uploads — return signed Cloudinary upload params for the admin.
// Role-gated via requireAdmin() (returns 403 for non-admins).

import { NextResponse } from "next/server";

import { signUploadParams } from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const params = signUploadParams();
    return NextResponse.json(params);
  } catch (error) {
    console.error("[uploads] failed to sign upload params:", error);
    return NextResponse.json(
      { error: "Image uploads are not configured." },
      { status: 500 },
    );
  }
}
