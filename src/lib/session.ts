// Server-side session helpers used by protected pages and admin API routes.

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  email: string;
  name?: string | null;
  role: "CUSTOMER" | "ADMIN";
};

/** Returns the current session user, or null if unauthenticated. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name,
    role: session.user.role,
  };
}

/** Requires a signed-in user; redirects to /login if there is none. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/** Requires an ADMIN user; redirects non-admins/guests to /login. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/login");
  }
  return user;
}
