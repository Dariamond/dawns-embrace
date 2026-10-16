"use server";

// Server action backing the checkout order summary. Re-reads product prices and
// stock from the DB (server-authoritative) so the summary never trusts client
// prices. Requires a signed-in user.

import { summarizeCart, type CartLineInput } from "@/lib/orders";
import { getCurrentUser } from "@/lib/session";

export type SummaryLine = {
  productId: string;
  name: string;
  unitPriceKobo: number;
  quantity: number;
  lineTotalKobo: number;
  inStock: boolean;
};

export type SummaryResult =
  | { ok: true; lines: SummaryLine[]; totalKobo: number }
  | { ok: false; error: string };

export async function getOrderSummary(
  items: CartLineInput[],
): Promise<SummaryResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "You must be signed in to check out." };
  }

  try {
    const { lines, totalKobo } = await summarizeCart(items);
    return {
      ok: true,
      totalKobo,
      lines: lines.map((line) => ({
        productId: line.productId,
        name: line.nameSnapshot,
        unitPriceKobo: line.unitPriceKobo,
        quantity: line.quantity,
        lineTotalKobo: line.unitPriceKobo * line.quantity,
        inStock: line.quantity <= line.stock,
      })),
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not summarize cart.",
    };
  }
}
