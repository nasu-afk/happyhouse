"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const PROPERTY_TYPES = ["apartment", "flat", "house", "villa", "plot", "shop", "office", "commercial", "other"];
const FURNISHING = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi-furnished" },
  { value: "fully_furnished", label: "Fully furnished" },
];

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = Object.fromEntries(searchParams.entries());

  function apply(next: Record<string, string | undefined>) {
    const usp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) usp.set(key, value);
      else usp.delete(key);
    }
    usp.delete("page"); // any filter change resets pagination
    router.push(`/properties?${usp.toString()}`);
  }

  function clearAll() {
    const usp = new URLSearchParams(searchParams.toString());
    for (const key of ["listing_type", "property_type", "locality", "min_price", "max_price", "bedrooms", "furnishing_status", "parking"]) {
      usp.delete(key);
    }
    usp.delete("page");
    router.push(`/properties?${usp.toString()}`);
  }

  const activeCount = ["listing_type", "property_type", "locality", "min_price", "max_price", "bedrooms", "furnishing_status", "parking"]
    .filter((k) => current[k]).length;

  const content = (
    <div className="space-y-6">
      <div>
        <span className="text-sm text-stone block mb-2">Looking to</span>
        <div className="flex gap-2">
          {[{ v: "", l: "Any" }, { v: "buy", l: "Buy" }, { v: "rent", l: "Rent" }].map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => apply({ listing_type: opt.v || undefined })}
              className={`px-3 py-1.5 rounded-card text-sm border ${
                (current.listing_type || "") === opt.v ? "bg-lake text-paper border-lake" : "border-line text-stone"
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="text-sm text-stone block mb-2">Property type</span>
        <select
          value={current.property_type || ""}
          onChange={(e) => apply({ property_type: e.target.value || undefined })}
          className="w-full border border-line rounded-card px-3 py-2 bg-paper text-sm"
        >
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-sm text-stone block mb-2">Locality</span>
        <input
          type="text"
          defaultValue={current.locality || ""}
          onBlur={(e) => apply({ locality: e.target.value || undefined })}
          placeholder="e.g. Majiwada"
          className="w-full border border-line rounded-card px-3 py-2 bg-paper text-sm"
        />
      </label>

      <div>
        <span className="text-sm text-stone block mb-2">Budget (₹)</span>
        <div className="flex gap-2">
          <input
            type="number"
            defaultValue={current.min_price || ""}
            onBlur={(e) => apply({ min_price: e.target.value || undefined })}
            placeholder="Min"
            className="w-1/2 border border-line rounded-card px-3 py-2 bg-paper text-sm"
          />
          <input
            type="number"
            defaultValue={current.max_price || ""}
            onBlur={(e) => apply({ max_price: e.target.value || undefined })}
            placeholder="Max"
            className="w-1/2 border border-line rounded-card px-3 py-2 bg-paper text-sm"
          />
        </div>
      </div>

      <label className="block">
        <span className="text-sm text-stone block mb-2">Bedrooms</span>
        <div className="flex gap-2">
          {["", "1", "2", "3", "4"].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => apply({ bedrooms: n || undefined })}
              className={`w-9 h-9 rounded-card text-sm border ${
                (current.bedrooms || "") === n ? "bg-lake text-paper border-lake" : "border-line text-stone"
              }`}
            >
              {n || "Any"}
            </button>
          ))}
        </div>
      </label>

      <label className="block">
        <span className="text-sm text-stone block mb-2">Furnishing</span>
        <select
          value={current.furnishing_status || ""}
          onChange={(e) => apply({ furnishing_status: e.target.value || undefined })}
          className="w-full border border-line rounded-card px-3 py-2 bg-paper text-sm"
        >
          <option value="">Any</option>
          {FURNISHING.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </label>

      {activeCount > 0 && (
        <button type="button" onClick={clearAll} className="text-sm text-clay hover:underline">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-6">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="border border-line rounded-card px-4 py-2.5 text-sm font-medium"
        >
          Filters {activeCount > 0 && `(${activeCount})`}
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <h2 className="font-display text-lg text-ink mb-4">Filters</h2>
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-night/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-paper p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg text-ink">Filters</h2>
              <button onClick={() => setMobileOpen(false)} aria-label="Close" className="text-2xl leading-none">×</button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
