"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { useCart } from "@/lib/cart-context";

/** Storefront top navigation with a live cart badge and auth-aware links. */
export function ShopNav() {
  const { itemCount } = useCart();
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-10 border-b border-gulf-blue/10 bg-brand-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          {/* Dark (gulf-blue) logo reads directly on the light header. */}
          <Image
            src="/brand/brand-logo-dark.png"
            alt="Dawn's Embrace logo"
            width={78}
            height={92}
            className="h-14 w-auto object-contain"
            priority
          />
          <span className="text-xl font-semibold tracking-tight text-gulf-blue">
            Dawn&apos;s Embrace
          </span>
        </Link>

        <div className="flex items-center gap-5 text-sm font-medium text-gulf-blue">
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

          {/* Auth-aware section. While loading, render nothing to avoid flicker. */}
          {status === "authenticated" && user ? (
            <>
              <Link href="/orders" className="hover:text-persian-blue">
                My Orders
              </Link>
              <SignOutButton className="rounded-full border border-gulf-blue/40 px-3 py-1 text-gulf-blue transition hover:bg-gulf-blue hover:text-brand-white" />
            </>
          ) : status === "unauthenticated" ? (
            <Link
              href="/login"
              className="rounded-full bg-persian-blue px-4 py-1.5 text-brand-white transition hover:bg-gulf-blue"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
