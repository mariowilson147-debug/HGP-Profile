"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  /** Tailwind aspect-ratio class, e.g. "aspect-square". Defaults to aspect-square */
  aspectRatio?: string;
  /** Fill the parent container instead of maintaining aspect ratio (useful in modal) */
  fill?: boolean;
  /** Called when the user taps the image (not after a swipe) */
  onClick?: () => void;
  /** objectFit style for the image */
  objectFit?: "cover" | "contain";
}

export default function ImageCarousel({
  images,
  alt,
  aspectRatio = "aspect-square",
  fill = false,
  onClick,
  objectFit = "cover",
}: ImageCarouselProps) {
  const validImages = images.filter(Boolean);
  const count = validImages.length;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  // Touch tracking
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const didSwipe    = useRef(false);          // true when the gesture was a real swipe

  const next = useCallback(() => setCurrent((c) => (c + 1) % count), [count]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + count) % count), [count]);

  // Auto-scroll every 3 s, paused on hover / active touch
  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(next, 3000);
    return () => clearInterval(id);
  }, [count, paused, next]);

  // ── Touch handlers ──────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    didSwipe.current    = false;
    setPaused(true);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;

    // Only treat as a horizontal swipe when Δx dominates and is large enough
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      didSwipe.current = true;
      if (dx > 0) next(); else prev();
    }

    touchStartX.current = null;
    touchStartY.current = null;

    // Resume auto-scroll after 5 s
    setTimeout(() => setPaused(false), 5000);
  };

  // ── Click guard ─────────────────────────────────────────────────────────────
  // The browser fires a synthetic click after touchend even on swipes.
  // We suppress it when didSwipe is true so the parent modal doesn't open.
  const handleClick = (e: React.MouseEvent) => {
    if (didSwipe.current) {
      e.stopPropagation();
      didSwipe.current = false;
      return;
    }
    onClick?.();
  };

  if (count === 0) {
    return (
      <div className={`${fill ? "w-full h-full" : aspectRatio + " w-full"} bg-slate-100 flex items-center justify-center`}>
        <span className="text-slate-400 text-xs">No image</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden group ${fill ? "w-full h-full" : aspectRatio + " w-full"}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      {validImages.map((src, i) => (
        <div
          key={src + i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          onClick={handleClick}
        >
          {fill ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={i === 0 ? alt : `${alt} variation ${i + 1}`}
              className={`w-full h-full ${objectFit === "contain" ? "object-contain" : "object-cover"} mix-blend-multiply drop-shadow-md`}
            />
          ) : (
            <Image
              src={src}
              alt={i === 0 ? alt : `${alt} variation ${i + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={`${objectFit === "contain" ? "object-contain" : "object-cover"} group-hover:scale-105 transition-transform duration-700 ease-out`}
            />
          )}
        </div>
      ))}

      {/* Left/Right Arrow Navigation */}
      {count > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); setPaused(true); setTimeout(() => setPaused(false), 5000); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-white/60 hover:bg-white/90 backdrop-blur-sm rounded-full text-slate-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); setPaused(true); setTimeout(() => setPaused(false), 5000); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-white/60 hover:bg-white/90 backdrop-blur-sm rounded-full text-slate-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dot indicators — only when multiple images; NO count badge */}
      {count > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
          {validImages.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to image ${i + 1}`}
              className={`pointer-events-auto transition-all duration-300 rounded-full ${
                i === current
                  ? "bg-white w-4 h-1.5 shadow-sm"   // active: wider pill
                  : "bg-white/50 w-1.5 h-1.5"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(i);
                setPaused(true);
                setTimeout(() => setPaused(false), 5000);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
