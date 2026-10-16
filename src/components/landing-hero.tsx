"use client";

// Animated landing hero (design.md §9). A Framer Motion staggered sequence on a
// dark brand surface:
//   t0  center hero watch scales + fades in (opacity 0→1, y 40→0, scale 0.9→1)
//   t1  "Dawns Embrace" wordmark + motto rise in
//   t2  left lineup fades from the left (x -40→0), right from the right (x 40→0)
//   t3  "Proceed to Order" button fades in → /shop
// Respects prefers-reduced-motion (useReducedMotion) with a static fallback,
// and is responsive (side lineups stack under the hero on small screens).

import { motion, useReducedMotion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.25, delayChildren: 0.1 },
  },
};

const heroWatch: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

const riseIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fromLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fromRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function LandingHero() {
  const reduceMotion = useReducedMotion();

  // Under reduced motion, render everything in its final state with no stagger.
  const initial = reduceMotion ? "show" : "hidden";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gulf-blue px-6 py-16 text-center text-brand-white">
      <motion.div
        variants={container}
        initial={initial}
        animate="show"
        className="flex w-full max-w-5xl flex-col items-center"
      >
        {/* t0 — center hero watch */}
        <motion.div
          variants={heroWatch}
          className="relative h-56 w-56 sm:h-72 sm:w-72"
        >
          <Image
            src="/brand/hero-watch.jpg"
            alt="Dawns Embrace signature watch"
            fill
            priority
            sizes="(max-width: 640px) 14rem, 18rem"
            className="rounded-2xl object-cover shadow-2xl"
          />
        </motion.div>

        {/* t1 — wordmark + motto */}
        <motion.h1
          variants={riseIn}
          className="mt-8 text-4xl font-semibold tracking-tight sm:text-6xl"
        >
          Dawns Embrace
        </motion.h1>
        <motion.p
          variants={riseIn}
          className="mt-3 text-lg text-persian-blue sm:text-xl"
        >
          A new day, a new you
        </motion.p>

        {/* t2 — side lineup images (stack under hero on mobile) */}
        <div className="mt-10 flex w-full flex-col items-center justify-center gap-6 sm:flex-row">
          <motion.div
            variants={fromLeft}
            className="relative h-40 w-full max-w-xs sm:h-48"
          >
            <Image
              src="/brand/lineup-left.jpg"
              alt="Dawns Embrace watch lineup"
              fill
              sizes="(max-width: 640px) 100vw, 20rem"
              className="rounded-xl object-cover shadow-lg"
            />
          </motion.div>
          <motion.div
            variants={fromRight}
            className="relative h-40 w-full max-w-xs sm:h-48"
          >
            <Image
              src="/brand/lineup-right.jpg"
              alt="Dawns Embrace watch lineup"
              fill
              sizes="(max-width: 640px) 100vw, 20rem"
              className="rounded-xl object-cover shadow-lg"
            />
          </motion.div>
        </div>

        {/* t3 — call to action */}
        <motion.div variants={riseIn} className="mt-12">
          <Link
            href="/shop"
            className="inline-block rounded-full bg-persian-blue px-8 py-3 text-base font-medium text-brand-white transition hover:bg-brand-white hover:text-gulf-blue"
          >
            Proceed to Order
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
