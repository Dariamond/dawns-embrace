// POST /api/addresses — create/update the current user's shipping address.
// Requires a signed-in user. When isDefault is set, clears the flag on the
// user's other addresses first.

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { isDefault, ...fields } = parsed.data;

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId: user.id,
      fullName: fields.fullName,
      phone: fields.phone,
      street: fields.street,
      city: fields.city,
      state: fields.state,
      country: fields.country,
      postalCode: fields.postalCode ?? null,
      isDefault: isDefault ?? false,
    },
  });

  return NextResponse.json({ address }, { status: 201 });
}
