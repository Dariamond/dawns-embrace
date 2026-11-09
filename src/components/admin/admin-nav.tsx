"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { SignOutButton } from "@/components/sign-out-button";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/settings", label: "Settings" },
];

/** Admin top navigation: inline links on desktop, hamburger menu on mobile. */
export function AdminNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="border-b border-gulf-blue/10 bg-gulf-blue text-brand-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/admin" className="flex items-center gap-2" onClick={close}>
          <Image
            src="/brand/brand-logo.png"
            alt="Dawn's Embrace logo"
            width={78}
            height={92}
            className="h-9 w-auto object-contain sm:h-12"
            priority
          />
          <span className="text-base font-semibold tracking-tight sm:text-lg">
            Dawn&apos;s Embrace · Admin
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-persian-blue">
              {l.label}
            </Link>
          ))}
          <Link href="/" className="text-brand-white/70 hover:text-brand-white">
            View store
          </Link>
          <SignOutButton className="rounded-full border border-brand-white/40 px-3 py-1 text-sm font-medium text-brand-white transition hover:bg-brand-white hover:text-gulf-blue" />
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-brand-white lg:hidden"
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
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-brand-white/15 px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 text-base font-medium">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                className="rounded-lg px-2 py-2.5 hover:bg-brand-white/10"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/"
              onClick={close}
              className="rounded-lg px-2 py-2.5 text-brand-white/80 hover:bg-brand-white/10"
            >
              View store
            </Link>
            <div className="px-2 pt-2">
              <SignOutButton className="w-full rounded-full border border-brand-white/40 px-3 py-2 text-center text-sm font-medium text-brand-white transition hover:bg-brand-white hover:text-gulf-blue" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
