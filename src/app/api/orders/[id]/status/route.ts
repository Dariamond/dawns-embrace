// POST /api/orders/[id]/status — admin-only order status advancement.
// Validates the requested transition against ORDER_STATUS_TRANSITIONS (via
// advanceStatus), writes the status + an OrderStatusEvent, and fires a
// customer notification for that transition.

import { NextResponse } from "next/server";

import { advanceStatus } from "@/lib/orders";
import { getCurrentUser } from "@/lib/session";
import { orderStatusSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = orderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await advanceStatus(id, parsed.data.status, parsed.data.note);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ status: result.status });
}
