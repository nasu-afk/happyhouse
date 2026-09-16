"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { PropertyImage } from "@/lib/types";

export function PropertyGallery({ images, title }: { images: PropertyImage[]; title: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length]
  );
  const next = useCallback(
    () => setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, close, prev, next]);

  if (images.length === 0) {
    return (
      <section className="h-[60vh] max-h-[560px] flex items-center justify-center bg-line text-stone">
        No images uploaded yet
      </section>
    );
  }

  return (
    <>
      <section className="grid grid-cols-4 grid-rows-2 gap-1 h-[60vh] max-h-[560px]">
        {images.slice(0, 5).map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className={`relative group ${i === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1"}`}
          >
            <Image src={img.image_url} alt={title} fill className="object-cover" />
            <div className="absolute inset-0 bg-night/0 group-hover:bg-night/20 transition-colors" />
            {i === 4 && images.length > 5 && (
              <div className="absolute inset-0 bg-night/60 flex items-center justify-center text-cream font-display text-lg">
                +{images.length - 5} more
              </div>
            )}
          </button>
        ))}
      </section>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-night/95 flex items-center justify-center"
            onClick={close}
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-5 right-6 text-cream/80 hover:text-cream text-3xl leading-none"
            >
              ×
            </button>

            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Previous image"
                className="absolute left-4 sm:left-8 text-cream/70 hover:text-cream text-4xl"
              >
                ‹
              </button>
            )}

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative w-[90vw] h-[80vh] max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[lightboxIndex].image_url}
                alt={title}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </motion.div>

            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Next image"
                className="absolute right-4 sm:right-8 text-cream/70 hover:text-cream text-4xl"
              >
                ›
              </button>
            )}

            <div className="absolute bottom-6 text-cream/60 text-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
