"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { PropertyCard as PropertyCardType } from "@/lib/types";
import { useFavorites } from "@/components/providers/FavoritesProvider";
import { useCompare } from "@/components/providers/CompareProvider";

function formatPrice(price: string, display: string | null): string {
  if (display) return display;
  const n = Number(price);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2).replace(/\.?0+$/, "")} Lakh`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function PropertyCard({ property }: { property: PropertyCardType }) {
  const reduceMotion = useReducedMotion();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isComparing, toggleCompare } = useCompare();
  const favorited = isFavorite(property.id);
  const comparing = isComparing(property.id);

  const specs = [
    property.bedrooms ? `${property.bedrooms} Bed` : null,
    property.bathrooms ? `${property.bathrooms} Bath` : null,
    property.area_sqft ? `${Math.round(Number(property.area_sqft))} sq.ft` : null,
  ].filter(Boolean);

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
    <Link
      href={`/properties/${property.slug}`}
      className="group block border border-line rounded-card overflow-hidden bg-paper transition-colors hover:border-lake"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-line">
        {property.primary_image ? (
          <Image
            src={property.primary_image}
            alt={property.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone text-sm">
            No image yet
          </div>
        )}

        <div className="absolute left-3 top-3 flex gap-2">
          <span className="bg-night/85 text-cream text-xs px-2.5 py-1 rounded-sm">
            {property.listing_type === "buy" ? "For sale" : "For rent"}
          </span>
          {property.featured && (
            <span className="bg-clay text-cream text-xs px-2.5 py-1 rounded-sm">
              Featured
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(property); }}
            aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
            aria-pressed={favorited}
            className="w-8 h-8 rounded-full bg-night/70 hover:bg-night/85 flex items-center justify-center transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill={favorited ? "#EFA608" : "none"} stroke={favorited ? "#EFA608" : "#F6F4EE"} strokeWidth="1.4">
              <path d="M8 14s-6-3.6-6-8.2C2 3 4 1.5 6.2 1.5 7.3 1.5 8 2.2 8 2.2S8.7 1.5 9.8 1.5C12 1.5 14 3 14 5.8 14 10.4 8 14 8 14Z" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(property); }}
            aria-label={comparing ? "Remove from comparison" : "Add to comparison"}
            aria-pressed={comparing}
            title="Compare"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              comparing ? "bg-lake" : "bg-night/70 hover:bg-night/85"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#F6F4EE" strokeWidth="1.6">
              {comparing ? (
                <path d="M3 8.5 6.5 12 13 4" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <>
                  <rect x="2" y="3" width="5" height="10" rx="1" />
                  <rect x="9" y="3" width="5" height="10" rx="1" />
                </>
              )}
            </svg>
          </button>
        </div>

        {property.status !== "available" && (
          <div className="absolute inset-0 bg-night/55 flex items-center justify-center">
            <span className="text-cream font-display text-lg capitalize">{property.status}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg leading-snug text-ink">{property.title}</h3>
        <p className="text-stone text-sm mt-1">{property.locality}, {property.city}</p>

        <p className="font-display text-xl text-lake-dark mt-3">
          {formatPrice(property.price, property.price_display)}
        </p>

        {specs.length > 0 && (
          <p className="text-sm text-stone mt-1">{specs.join(" · ")}</p>
        )}
      </div>
    </Link>
    </motion.div>
  );
}
