// Admin shell. requireAdmin() redirects non-admins/guests to /login before any
// admin page renders, so every (admin) route is role-gated at the layout level.

import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
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
      <AdminNav />
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
    </div>
  );
}
