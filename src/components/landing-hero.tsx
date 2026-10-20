"use client";

// Landing hero — a full-bleed model photo that fills the entire viewport (no
// scrolling, no visible page background). Over the image, a Framer Motion
// staggered sequence floats in:
//   t0  "Dawns Embrace" wordmark rises/fades in
//   t1  motto "A new day, a new you" rises in
//   t2  "Proceed to Order" button fades in → /shop
// A subtle bottom-to-top dark scrim sits between the photo and the text so the
// white text stays readable over any part of the image. Respects
// prefers-reduced-motion with a static fallback.

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.3, delayChildren: 0.3 },
  },
};

const riseIn: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export function LandingHero() {
  const reduceMotion = useReducedMotion();

  // Under reduced motion, render everything in its final state with no stagger.
  const initial = reduceMotion ? "show" : "hidden";

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-white">
      {/* Full-bleed model photo — covers the entire screen */}
      <Image
        src="/brand/hero-model.jpeg"
        alt="Dawn's Embrace — model wearing the signature watch"
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Readability scrim: transparent at top, darker toward the bottom where the
          text sits. Keeps the white text legible without a visible text box. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
      />

      {/* Floating content, anchored toward the lower area of the screen */}
      <motion.div
        variants={container}
        initial={initial}
        animate="show"
        className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-16 text-center text-brand-white sm:pb-20"
      >
        <motion.h1
          variants={riseIn}
          className="text-5xl font-semibold tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:text-7xl"
        >
          Dawn&apos;s Embrace
        </motion.h1>
        <motion.p
          variants={riseIn}
          className="mt-3 text-lg font-light tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] sm:text-2xl"
        >
          A new day, a new you
        </motion.p>
        <motion.div variants={riseIn} className="mt-8">
          <Link
            href="/intro"
            className="inline-block rounded-full bg-persian-blue px-9 py-3.5 text-base font-medium text-brand-white shadow-lg transition hover:bg-brand-white hover:text-gulf-blue"
          >
            Proceed to Order
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
