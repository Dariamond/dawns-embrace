"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/lib/cart-context";
import { formatKobo } from "@/lib/money";

export default function CartPage() {
  const { items, itemCount, subtotalKobo, updateQty, removeItem } = useCart();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gulf-blue">Your cart</h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl bg-brand-white p-8 text-center shadow-sm">
          <p className="text-gray-600">Your cart is empty.</p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-lg bg-persian-blue px-5 py-2.5 font-medium text-brand-white transition hover:bg-gulf-blue"
          >
            Browse watches
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center gap-4 rounded-xl bg-brand-white p-4 shadow-sm"
              >
                <Link
                  href={`/product/${item.productId}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.productId}`}
                    className="font-medium text-gulf-blue hover:text-persian-blue"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-gray-600">
                    {formatKobo(item.unitPriceKobo)} each
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`qty-${item.productId}`}
                    className="sr-only"
                  >
                    Quantity for {item.name}
                  </label>
                  <input
                    id={`qty-${item.productId}`}
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateQty(
                        item.productId,
                        Number.parseInt(e.target.value, 10) || 0,
                      )
                    }
                    className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-gray-900 outline-none focus:border-persian-blue focus:ring-2 focus:ring-persian-blue/30"
                  />
                </div>

                <div className="w-24 text-right font-semibold text-persian-blue">
                  {formatKobo(item.unitPriceKobo * item.quantity)}
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="rounded-xl bg-brand-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-gray-700">
              <span>
                Items (<span>{itemCount}</span>)
              </span>
              <span className="text-xl font-bold text-gulf-blue">
                {formatKobo(subtotalKobo)}
              </span>
            </div>

            <Link
              href="/checkout"
              className="mt-6 block w-full rounded-lg bg-persian-blue py-3 text-center font-medium text-brand-white transition hover:bg-gulf-blue"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
