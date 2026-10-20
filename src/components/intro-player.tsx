"use client";

// Full-screen interstitial video player. Autoplays muted (browsers block
// autoplay with sound), auto-advances to /shop when the video ends, and offers
// Skip + sound controls. If the video errors, we move on to /shop rather than
// trapping the user on a broken screen.

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function IntroPlayer({ src }: { src: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const advancedRef = useRef(false);
  const [muted, setMuted] = useState(true);

  // Prefetch the shop so the hand-off is instant.
  useEffect(() => {
    router.prefetch("/shop");
  }, [router]);

  const goToShop = useCallback(() => {
    // Guard against double navigation (e.g. ended + click).
    if (advancedRef.current) return;
    advancedRef.current = true;
    router.push("/shop");
  }, [router]);

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    setMuted(next);
    // Unmuting mid-play can require a fresh play() in some browsers.
    if (!next) {
      void video.play().catch(() => {});
    }
  }

  return (
    <main className="relative flex h-[100svh] w-full items-center justify-center overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        playsInline
        onEnded={goToShop}
        onError={goToShop}
        className="h-full w-full object-contain"
      />

      {/* Controls overlay */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 sm:p-8">
        {/* Top-right: sound toggle */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleSound}
            className="pointer-events-auto rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-brand-white backdrop-blur transition hover:bg-black/70"
          >
            {muted ? "🔇 Tap for sound" : "🔊 Sound on"}
          </button>
        </div>

        {/* Bottom-right: skip */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={goToShop}
            className="pointer-events-auto rounded-full bg-persian-blue px-6 py-2.5 text-sm font-medium text-brand-white shadow-lg transition hover:bg-brand-white hover:text-gulf-blue"
          >
            Skip to shop →
          </button>
        </div>
      </div>
    </main>
  );
}
