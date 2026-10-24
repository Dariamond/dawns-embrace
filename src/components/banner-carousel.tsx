"use client";

// Auto-rotating promotional banner carousel for the top of the shop page
// (Jumia-style). Swipe/drag or use the arrows/dots to move between slides; it
// also advances on its own every 5s, pausing on hover. Slides with a linkUrl
// wrap the image in a link. Renders nothing when there are no active banners,
// and honours prefers-reduced-motion by not auto-advancing.
//
// Follows the framer-motion slide pattern from src/components/product-gallery.tsx.

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type BannerSlide = {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
};

const SWIPE_DISTANCE = 50; // px of drag needed to change slide
const AUTO_ROTATE_MS = 5000;

export function BannerCarousel({ banners }: { banners: BannerSlide[] }) {
  const count = banners.length;

  // [currentIndex, direction] — direction drives the slide animation.
  const [[index, direction], setState] = useState<[number, number]>([0, 0]);
  const [paused, setPaused] = useState(false);

  const paginate = useCallback(
    (dir: number) => {
      setState(([current]) => {
        const next = (current + dir + count) % count;
        return [next, dir];
      });
    },
    [count],
  );

  const goTo = useCallback((target: number) => {
    setState(([current]) => [target, target > current ? 1 : -1]);
  }, []);

  // Auto-rotate every 5s, unless paused, single slide, or the user prefers
  // reduced motion. Guarded for SSR (no window on the server).
  useEffect(() => {
    if (count <= 1 || paused) return;
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduce) return;
    }
    const timer = window.setInterval(() => paginate(1), AUTO_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, index, paginate]);

  if (count === 0) {
    return null;
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_DISTANCE) {
      paginate(1);
    } else if (info.offset.x > SWIPE_DISTANCE) {
      paginate(-1);
    }
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0.4 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0.4 }),
  };

  const current = banners[index];

  return (
    <div
      className="relative mb-8 aspect-[16/9] w-full touch-pan-y select-none overflow-hidden rounded-2xl bg-gray-100"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag={count > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={onDragEnd}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          {current.linkUrl ? (
            <Link
              href={current.linkUrl}
              className="block h-full w-full"
              draggable={false}
            >
              <Image
                src={current.imageUrl}
                alt={`Promotional banner ${index + 1} of ${count}`}
                fill
                sizes="(max-width: 1152px) 100vw, 1152px"
                className="object-cover"
                priority={index === 0}
                draggable={false}
              />
            </Link>
          ) : (
            <Image
              src={current.imageUrl}
              alt={`Promotional banner ${index + 1} of ${count}`}
              fill
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="pointer-events-none object-cover"
              priority={index === 0}
              draggable={false}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <>
          {/* Prev / next arrows (desktop convenience) */}
          <button
            type="button"
            onClick={() => paginate(-1)}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/40 p-2 text-brand-white backdrop-blur transition hover:bg-black/60 sm:flex"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => paginate(1)}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/40 p-2 text-brand-white backdrop-blur transition hover:bg-black/60 sm:flex"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to banner ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${
                  i === index
                    ? "w-5 bg-brand-white"
                    : "w-2 bg-brand-white/50 hover:bg-brand-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
