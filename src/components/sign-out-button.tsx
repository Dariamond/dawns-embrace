"use client";

import { signOut } from "next-auth/react";

/** Signs the user out and returns them to the landing page. */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={
        className ??
        "rounded-full border border-current px-3 py-1 text-sm font-medium transition hover:bg-current/10"
      }
    >
      Sign out
    </button>
  );
}
