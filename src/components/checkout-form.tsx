"use client";

// Checkout form: collects the shipping address, shows a SERVER-recomputed order
// summary (via the getOrderSummary server action — never trusts client prices),
// and starts a Paystack payment by posting the cart to /api/checkout.

import { useEffect, useState } from "react";

import { getOrderSummary, type SummaryResult } from "@/app/(shop)/checkout/actions";
import { useCart } from "@/lib/cart-context";
import { formatKobo } from "@/lib/money";

type AddressFields = {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

const EMPTY_ADDRESS: AddressFields = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  country: "Nigeria",
  postalCode: "",
};

export function CheckoutForm() {
  const { items, clear } = useCart();

  const [address, setAddress] = useState<AddressFields>(EMPTY_ADDRESS);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-fetch the server-authoritative summary whenever the cart changes.
  useEffect(() => {
    let cancelled = false;
    const cartItems = items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    }));

    if (cartItems.length === 0) {
      setSummary({ ok: true, lines: [], totalKobo: 0 });
      return;
    }

    setLoadingSummary(true);
    (async () => {
      const result = await getOrderSummary(cartItems);
      if (!cancelled) {
        setSummary(result);
        setLoadingSummary(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items]);

  function updateField(field: keyof AddressFields, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // 1. Save the shipping address.
      const addrRes = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...address,
          postalCode: address.postalCode || undefined,
          isDefault: true,
        }),
      });
      const addrData = await addrRes.json();
      if (!addrRes.ok) {
        setError(addrData?.error ?? "Could not save your address.");
        setSubmitting(false);
        return;
      }

      // 2. Create the order + init Paystack (server recomputes the total).
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          addressId: addrData?.address?.id,
        }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok || !checkoutData?.authorizationUrl) {
        setError(checkoutData?.error ?? "Could not start payment.");
        setSubmitting(false);
        return;
      }

      // 3. Clear the local cart and redirect to Paystack hosted checkout.
      clear();
      window.location.href = checkoutData.authorizationUrl;
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const summaryOk = summary?.ok ? summary : null;
  const canPay =
    !submitting &&
    items.length > 0 &&
    !!summaryOk &&
    summaryOk.lines.every((l) => l.inStock);

  return (
    <form onSubmit={handlePay} className="grid gap-8 md:grid-cols-2">
      {/* Address */}
      <section className="rounded-xl bg-brand-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gulf-blue">
          Shipping address
        </h2>
        <div className="mt-4 space-y-4">
          <Field
            id="fullName"
            label="Full name"
            value={address.fullName}
            onChange={(v) => updateField("fullName", v)}
            autoComplete="name"
          />
          <Field
            id="phone"
            label="Phone"
            value={address.phone}
            onChange={(v) => updateField("phone", v)}
            autoComplete="tel"
          />
          <Field
            id="street"
            label="Street"
            value={address.street}
            onChange={(v) => updateField("street", v)}
            autoComplete="address-line1"
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="city"
              label="City"
              value={address.city}
              onChange={(v) => updateField("city", v)}
              autoComplete="address-level2"
            />
            <Field
              id="state"
              label="State"
              value={address.state}
              onChange={(v) => updateField("state", v)}
              autoComplete="address-level1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field
              id="country"
              label="Country"
              value={address.country}
              onChange={(v) => updateField("country", v)}
              autoComplete="country-name"
            />
            <Field
              id="postalCode"
              label="Postal code (optional)"
              value={address.postalCode}
              onChange={(v) => updateField("postalCode", v)}
              required={false}
              autoComplete="postal-code"
            />
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="rounded-xl bg-brand-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gulf-blue">Order summary</h2>

        {loadingSummary && (
          <p className="mt-4 text-sm text-gray-500">Calculating total…</p>
        )}

        {summary && !summary.ok && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {summary.error}
          </p>
        )}

        {summaryOk && summaryOk.lines.length === 0 && !loadingSummary && (
          <p className="mt-4 text-sm text-gray-500">Your cart is empty.</p>
        )}

        {summaryOk && summaryOk.lines.length > 0 && (
          <>
            <ul className="mt-4 space-y-3">
              {summaryOk.lines.map((line) => (
                <li
                  key={line.productId}
                  className="flex items-start justify-between gap-4 text-sm"
                >
                  <span className="text-gray-700">
                    {line.name}
                    <span className="text-gray-500"> × {line.quantity}</span>
                    {!line.inStock && (
                      <span className="ml-2 text-red-600">
                        (insufficient stock)
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-gulf-blue">
                    {formatKobo(line.lineTotalKobo)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="font-medium text-gray-700">Total</span>
              <span className="text-xl font-bold text-persian-blue">
                {formatKobo(summaryOk.totalKobo)}
              </span>
            </div>
          </>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canPay}
          className="mt-6 w-full rounded-lg bg-persian-blue py-3 font-medium text-brand-white transition hover:bg-gulf-blue disabled:opacity-60"
        >
          {submitting ? "Starting payment…" : "Pay with Paystack"}
        </button>
        <p className="mt-2 text-center text-xs text-gray-500">
          Payment is processed securely by Paystack (test mode).
        </p>
      </section>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  autoComplete,
  required = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type="text"
        required={required}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-persian-blue focus:ring-2 focus:ring-persian-blue/30"
      />
    </div>
  );
}
