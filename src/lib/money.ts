// Money helpers. Prices are stored as integer kobo (NGN minor unit) everywhere.

/** Convert integer kobo to a naira number (may have a fractional part). */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format integer kobo as an NGN currency string, e.g. 1500000 -> "₦15,000.00". */
export function formatKobo(kobo: number): string {
  return nairaFormatter.format(koboToNaira(kobo));
}
