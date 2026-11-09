"use client";

// Swipeable product image carousel (Jumia-style). Swipe/drag left-right on the
// main image to move between photos; dot indicators + prev/next arrows also
// work on desktop. A thumbnail strip below mirrors the active image. Works with
// touch and mouse. Gracefully handles a single image (no controls).

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import Image from "next/image";
import { useCallback, useState } from "react";

type GalleryImage = {
  id: string;
  url: string;
};

const SWIPE_DISTANCE = 50; // px of drag needed to change slide

export function ProductGallery({
  mainImageUrl,
  name,
  images,
}: {
  mainImageUrl: string;
  name: string;
  images: GalleryImage[];
}) {
  const slides = [
    { key: "main", url: mainImageUrl },
    ...images.map((image) => ({ key: image.id, url: image.url })),
  ];
  const count = slides.length;

  // [currentIndex, direction] — direction drives the slide animation.
  const [[index, direction], setState] = useState<[number, number]>([0, 0]);

  const paginate = useCallback(
    (dir: number) => {
      setState(([current]) => {
        const next = (current + dir + count) % count;
        return [next, dir];
      });
    },
    [count],
  );

  const goTo = useCallback(
    (target: number) => {
      setState(([current]) => [target, target > current ? 1 : -1]);
    },
    [],
  );

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

  return (
    <div className="flex flex-col gap-4">
      {/* Main swipeable stage */}
      <div className="relative aspect-square w-full touch-pan-y select-none overflow-hidden rounded-2xl bg-gray-100">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={slides[index].key}
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
            <Image
              src={slides[index].url}
              alt={`${name} — image ${index + 1} of ${count}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="pointer-events-none object-cover"
              priority={index === 0}
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <>
            {/* Prev / next arrows (desktop convenience) */}
            <button
              type="button"
              onClick={() => paginate(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/40 p-2 text-brand-white backdrop-blur transition hover:bg-black/60 sm:flex"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => paginate(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/40 p-2 text-brand-white backdrop-blur transition hover:bg-black/60 sm:flex"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
              {slides.map((slide, i) => (
                <button
                  key={slide.key}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to image ${i + 1}`}
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

      {/* Thumbnail strip (tap to jump; horizontally scrollable on small screens) */}
      {count > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {slides.map((slide, i) => {
            const isActive = i === index;
            return (
              <button
                key={slide.key}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`View image ${i + 1}`}
                aria-pressed={isActive}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 ${
                  isActive
                    ? "ring-2 ring-persian-blue"
                    : "ring-1 ring-gray-200 hover:ring-gray-300"
                }`}
              >
                <Image src={slide.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
