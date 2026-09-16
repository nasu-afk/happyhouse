"use client";

import Link from "next/link";
import Image from "next/image";
import { useCompare } from "@/components/providers/CompareProvider";

function formatPrice(price: string, display: string | null): string {
  if (display) return display;
  const n = Number(price);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2).replace(/\.?0+$/, "")} Lakh`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function ComparePage() {
  const { compareList, toggleCompare, clearCompare, maxCompare } = useCompare();

  const rows: [string, (p: (typeof compareList)[number]) => React.ReactNode][] = [
    ["Price", (p) => <span className="font-display text-lg text-lake-dark">{formatPrice(p.price, p.price_display)}</span>],
    ["Locality", (p) => `${p.locality}, ${p.city}`],
    ["Listing", (p) => (p.listing_type === "buy" ? "For sale" : "For rent")],
    ["Type", (p) => <span className="capitalize">{p.property_type}</span>],
    ["Bedrooms", (p) => p.bedrooms ?? "—"],
    ["Bathrooms", (p) => p.bathrooms ?? "—"],
    ["Area", (p) => (p.area_sqft ? `${Math.round(Number(p.area_sqft))} sq.ft` : "—")],
    ["Status", (p) => <span className="capitalize">{p.status}</span>],
    ["Featured", (p) => (p.featured ? "Yes" : "—")],
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
      <div className="flex items-baseline justify-between mb-3">
        <h1 className="font-display text-4xl text-ink">Compare properties</h1>
        {compareList.length > 0 && (
          <button onClick={clearCompare} className="text-sm text-clay hover:underline">Clear all</button>
        )}
      </div>
      <p className="text-stone mb-10">
        Up to {maxCompare} properties side by side. Tap the compare icon on any listing to add it here.
      </p>

      {compareList.length === 0 ? (
        <div className="border border-dashed border-line rounded-card p-16 text-center text-stone">
          <p className="mb-4">No properties selected for comparison.</p>
          <Link href="/properties" className="text-lake-dark hover:underline">Browse properties →</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr>
                <th className="w-32" />
                {compareList.map((p) => (
                  <th key={p.id} className="text-left align-top p-3 min-w-[200px]">
                    <div className="relative aspect-[4/3] rounded-card overflow-hidden bg-line mb-3">
                      {p.primary_image ? (
                        <Image src={p.primary_image} alt={p.title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-stone text-xs">No image</div>
                      )}
                    </div>
                    <Link href={`/properties/${p.slug}`} className="font-display text-base text-ink hover:text-lake-dark transition-colors block mb-2">
                      {p.title}
                    </Link>
                    <button onClick={() => toggleCompare(p)} className="text-xs text-clay hover:underline">
                      Remove
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, render]) => (
                <tr key={label} className="border-t border-line">
                  <td className="p-3 text-sm text-stone whitespace-nowrap">{label}</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="p-3 text-sm text-ink">{render(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
