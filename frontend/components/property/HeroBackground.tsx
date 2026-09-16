"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Hero background, grounded in the actual brief rather than generic
 * decoration: Thane is known locally as the "City of Lakes," ringed by
 * the Yeoor hills — so the visual is a set of topographic contour
 * lines, evoking a survey map of land and water. That's literally what
 * a property consultancy trades in, which a generic gradient blob or
 * stock-photo stand-in wouldn't communicate.
 *
 * Motion is a single orchestrated reveal (the contours draw themselves
 * in once, staggered) rather than continuous ambient looping — the
 * looping-blob treatment is exactly the kind of scattered, un-deliberate
 * motion that reads as templated. Reduced-motion users see the finished
 * static linework immediately, nothing is lost.
 */

// Five nested, irregular closed contour rings — offset centers so it
// reads as an actual landform (lake + rising ground), not concentric
// circles.
const CONTOURS = [
  "M 80,420 C 40,380 60,300 140,270 C 220,240 320,250 360,310 C 400,370 360,430 300,450 C 220,480 120,460 80,420 Z",
  "M 60,440 C 10,390 30,290 130,250 C 240,205 370,220 420,300 C 465,375 415,450 335,480 C 235,515 110,495 60,440 Z",
  "M 30,460 C -30,395 -5,270 115,225 C 250,175 405,195 465,290 C 520,380 460,465 365,500 C 245,545 90,525 30,460 Z",
  "M 0,480 C -70,405 -40,255 100,200 C 260,140 440,165 510,275 C 575,380 500,475 390,515 C 250,565 65,540 0,480 Z",
  "M -30,500 C -115,415 -80,240 85,175 C 270,105 475,135 555,260 C 630,378 540,485 415,530 C 255,588 65,555 -30,500 Z",
];

export function HeroBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-night" />

      <svg
        viewBox="0 0 620 620"
        className="absolute -right-20 -top-10 h-[130%] w-auto opacity-[0.35]"
        fill="none"
      >
        {CONTOURS.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            stroke="#2E655A"
            strokeWidth={1.5}
            initial={reduceMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.8, delay: i * 0.15, ease: "easeOut" }}
          />
        ))}
      </svg>

      {/* A second, smaller contour cluster low-left for asymmetric balance */}
      <svg
        viewBox="0 0 300 300"
        className="absolute -left-12 -bottom-16 h-[55%] w-auto opacity-[0.22]"
        fill="none"
      >
        {CONTOURS.slice(0, 3).map((d, i) => (
          <motion.path
            key={i}
            d={d}
            stroke="#8B5A3C"
            strokeWidth={1.5}
            initial={reduceMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.4 + i * 0.15, ease: "easeOut" }}
          />
        ))}
      </svg>

      {/* Bottom fade so text stays legible regardless of the linework behind it */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink to-transparent" />
    </div>
  );
}
