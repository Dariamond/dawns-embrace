// Admin shell. requireAdmin() redirects non-admins/guests to /login before any
// admin page renders, so every (admin) route is role-gated at the layout level.

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/sign-out-button";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gulf-blue/10 bg-gulf-blue text-brand-white">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image
              src="/brand/brand-logo.png"
              alt="Dawn's Embrace logo"
              width={78}
              height={92}
              className="h-12 w-auto object-contain"
              priority
            />
            <span className="text-lg font-semibold tracking-tight">
              Dawn&apos;s Embrace · Admin
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/admin" className="hover:text-persian-blue">
              Dashboard
            </Link>
            <Link href="/admin/products" className="hover:text-persian-blue">
              Products
            </Link>
            <Link href="/admin/banners" className="hover:text-persian-blue">
              Banners
            </Link>
            <Link href="/admin/orders" className="hover:text-persian-blue">
              Orders
            </Link>
            <Link href="/admin/settings" className="hover:text-persian-blue">
              Settings
            </Link>
            <Link
              href="/"
              className="text-brand-white/70 hover:text-brand-white"
            >
              View store
            </Link>
            <SignOutButton className="rounded-full border border-brand-white/40 px-3 py-1 text-sm font-medium text-brand-white transition hover:bg-brand-white hover:text-gulf-blue" />
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}
