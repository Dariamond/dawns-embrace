"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { SignOutButton } from "@/components/sign-out-button";
import { useCart } from "@/lib/cart-context";

/** Storefront top navigation: inline links on desktop, hamburger menu on mobile. */
export function ShopNav() {
  const { itemCount } = useCart();
  const { data: session, status } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-20 border-b border-gulf-blue/10 bg-brand-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo + wordmark */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3" onClick={close}>
          <Image
            src="/brand/brand-logo-dark.png"
            alt="Dawn's Embrace logo"
            width={78}
            height={92}
            className="h-10 w-auto object-contain sm:h-14"
            priority
          />
          <span className="text-lg font-semibold tracking-tight text-gulf-blue sm:text-xl">
            Dawn&apos;s Embrace
          </span>
        </Link>

        {/* Desktop links (inline) */}
        <div className="hidden items-center gap-5 text-sm font-medium text-gulf-blue sm:flex">
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

        {/* Mobile: cart icon + hamburger */}
        <div className="flex items-center gap-1 sm:hidden">
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative rounded-lg p-2 text-gulf-blue"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6h15l-1.5 9h-12L6 6zm0 0L5 3H2m5 15a1 1 0 100 2 1 1 0 000-2zm11 0a1 1 0 100 2 1 1 0 000-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute right-0 top-0 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-persian-blue px-1 py-0.5 text-[10px] text-brand-white">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-gulf-blue"
          >
            {open ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="border-t border-gulf-blue/10 bg-brand-white px-4 py-3 text-gulf-blue sm:hidden">
          <div className="flex flex-col gap-1 text-base font-medium">
            <Link href="/shop" onClick={close} className="rounded-lg px-2 py-2.5 hover:bg-gray-50">
              Shop
            </Link>
            <Link href="/cart" onClick={close} className="rounded-lg px-2 py-2.5 hover:bg-gray-50">
              Cart{itemCount > 0 ? ` (${itemCount})` : ""}
            </Link>
            {status === "authenticated" && user ? (
              <>
                <Link href="/orders" onClick={close} className="rounded-lg px-2 py-2.5 hover:bg-gray-50">
                  My Orders
                </Link>
                <div className="px-2 pt-2">
                  <SignOutButton className="w-full rounded-full border border-gulf-blue/40 px-3 py-2 text-center text-gulf-blue transition hover:bg-gulf-blue hover:text-brand-white" />
                </div>
              </>
            ) : status === "unauthenticated" ? (
              <Link
                href="/login"
                onClick={close}
                className="mt-1 rounded-full bg-persian-blue px-4 py-2.5 text-center text-brand-white transition hover:bg-gulf-blue"
              >
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
