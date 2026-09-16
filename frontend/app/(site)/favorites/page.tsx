"use client";

import Link from "next/link";
import { useFavorites } from "@/components/providers/FavoritesProvider";
import { PropertyCard } from "@/components/property/PropertyCard";

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  return (
    <main className="max-w-6xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
      <h1 className="font-display text-4xl text-ink mb-3">Saved properties</h1>
      <p className="text-stone mb-10">
        Properties you&apos;ve saved on this device. Tap the heart on any listing to save it here.
      </p>

      {favorites.length === 0 ? (
        <div className="border border-dashed border-line rounded-card p-16 text-center text-stone">
          <p className="mb-4">Nothing saved yet.</p>
          <Link href="/properties" className="text-lake-dark hover:underline">Browse properties →</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </main>
  );
}
