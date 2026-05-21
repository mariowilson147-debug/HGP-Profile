"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  /** Tailwind aspect-ratio class, e.g. "aspect-square". Defaults to aspect-square */
  aspectRatio?: string;
  /** Fill the parent container instead of maintaining aspect ratio (useful in modal) */
  fill?: boolean;
  /** Called when the user taps/clicks the image (not the dots) */
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
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => setCurrent((c) => (c + 1) % count), [count]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + count) % count), [count]);

  // Auto-scroll every 3 s, paused on hover/touch
  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(next, 3000);
    return () => clearInterval(id);
  }, [count, paused, next]);

  // Touch/swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 30) { if (delta > 0) next(); else prev(); }
    touchStartX.current = null;
    // resume auto-scroll after 5 s
    setTimeout(() => setPaused(false), 5000);
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
      ref={containerRef}
      className={`relative overflow-hidden ${fill ? "w-full h-full" : aspectRatio + " w-full"}`}
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
          onClick={onClick}
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

      {/* Dot indicators — only if multiple images */}
      {count > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
          {validImages.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to image ${i + 1}`}
              className={`pointer-events-auto w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "bg-white scale-125 shadow-sm"
                  : "bg-white/50"
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

      {/* Variation count badge */}
      {count > 1 && (
        <div className="absolute top-2 right-2 z-20 bg-black/40 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none">
          {current + 1}/{count}
        </div>
      )}
    </div>
  );
}
