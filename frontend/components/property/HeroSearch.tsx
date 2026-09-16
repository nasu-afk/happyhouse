"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PROPERTY_TYPES = [
  "apartment", "flat", "house", "villa", "plot", "shop", "office", "commercial", "other",
] as const;

export function HeroSearch() {
  const router = useRouter();
  const [listingType, setListingType] = useState<"buy" | "rent">("buy");
  const [propertyType, setPropertyType] = useState("");
  const [locality, setLocality] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  function handleSearch() {
    const params = new URLSearchParams({ listing_type: listingType });
    if (propertyType) params.set("property_type", propertyType);
    if (locality) params.set("locality", locality);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="w-full bg-cream text-night rounded-card border border-[#DEDACD] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      <div className="flex gap-2 mb-5">
        {(["buy", "rent"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setListingType(type)}
            className={`px-4 py-2 rounded-card text-sm font-medium transition-colors ${
              listingType === type ? "bg-lake text-cream" : "bg-[#DEDACD] text-[#78746A]"
            }`}
          >
            {type === "buy" ? "Buy" : "Rent"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm text-[#78746A]">Property type</span>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="mt-1 w-full border border-[#DEDACD] rounded-card px-3 py-2 bg-cream"
          >
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-[#78746A]">Location</span>
          <input
            type="text"
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            placeholder="e.g. Majiwada, Ghodbunder Road"
            className="mt-1 w-full border border-[#DEDACD] rounded-card px-3 py-2 bg-cream"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-[#78746A]">Min budget</span>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="mt-1 w-full border border-[#DEDACD] rounded-card px-3 py-2 bg-cream"
            />
          </label>
          <label className="block">
            <span className="text-sm text-[#78746A]">Max budget</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="mt-1 w-full border border-[#DEDACD] rounded-card px-3 py-2 bg-cream"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleSearch}
          className="w-full bg-night text-cream py-3 rounded-card font-medium hover:bg-lake-dark transition-colors"
        >
          Search properties
        </button>
      </div>
    </div>
  );
}
