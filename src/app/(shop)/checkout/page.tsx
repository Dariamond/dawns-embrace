// Checkout page (server component). Gate: session AND emailVerified != null.
// - Unauthenticated -> redirect to /login?callbackUrl=/checkout.
// - Authenticated but unverified -> render a verify prompt (no redirect loop).
// - Verified -> render the CheckoutForm (address + server-recomputed summary).

import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/checkout-form";
import { VerifyPrompt } from "@/components/verify-prompt";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    redirect("/login?callbackUrl=/checkout");
  }

  // emailVerified isn't on the session; re-fetch it (checkout gate).
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { email: true, emailVerified: true },
  });

  if (!user) {
    redirect("/login?callbackUrl=/checkout");
  }

  if (user.emailVerified === null) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-3xl font-bold text-gulf-blue">Verify your email</h1>
        <p className="mt-2 text-gray-600">
          You need a verified email address before you can check out. We can
          send a fresh verification link to <strong>{user.email}</strong>.
        </p>
        <div className="mt-6">
          <VerifyPrompt email={user.email} />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gulf-blue">Checkout</h1>
      <p className="mt-2 text-gray-600">
        Enter your shipping address and review your order.
      </p>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </main>
  );
}
