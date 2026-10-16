"use client";

import Link from "next/link";

import { useCart } from "@/lib/cart-context";

/** Storefront top navigation with a live cart item-count badge. */
export function ShopNav() {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-10 border-b border-gulf-blue/10 bg-brand-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-gulf-blue">
          Dawns Embrace
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium text-gulf-blue">
          <Link href="/shop" className="hover:text-persian-blue">
            Shop
          </Link>
          <Link href="/cart" className="relative hover:text-persian-blue">
            Cart
            {itemCount > 0 && (
              <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-persian-blue px-1.5 py-0.5 text-xs text-brand-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}
