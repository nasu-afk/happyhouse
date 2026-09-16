import Link from "next/link";
import { api } from "@/lib/api";
import { PropertyCard } from "@/components/property/PropertyCard";
import { HeroSearch } from "@/components/property/HeroSearch";
import { HeroBackground } from "@/components/property/HeroBackground";

// Always render per-request — property data changes constantly and must
// never be baked in at build time (spec §20: new properties appear
// automatically, with no rebuild/redeploy).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, featuredResult] = await Promise.all([
    api.settings.get(),
    api.properties.list({ featured: true, page_size: 6 }),
  ]);

  // Graceful fallback per spec §15 — never show fake listings.
  const showcase = featuredResult.items.length > 0
    ? featuredResult.items
    : (await api.properties.list({ sort: "newest", page_size: 6 })).items;

  return (
    <main>
      {/* HERO — asymmetric: large image field, search panel overlapping its edge */}
      <section className="relative bg-night text-cream">
        <div className="grid lg:grid-cols-[1.3fr_1fr] min-h-[560px]">
          <div className="relative flex items-end px-6 py-16 lg:px-16 lg:py-24 overflow-hidden">
            <HeroBackground />
            <div className="relative max-w-xl">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
                Find a place you&apos;ll love to call home.
              </h1>
              <p className="mt-5 text-cream/80 text-lg max-w-md">
                Explore properties across Thane with {settings.business_name} Property Consultancy.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/properties"
                  className="bg-cream text-night px-6 py-3 rounded-card font-medium hover:bg-[#DEDACD] transition-colors"
                >
                  Explore properties
                </Link>
                <Link
                  href="/contact"
                  className="border border-cream/40 px-6 py-3 rounded-card font-medium hover:border-cream transition-colors"
                >
                  Talk to a consultant
                </Link>
              </div>
            </div>
          </div>

          {/* Search panel overlaps the hero edge on large screens */}
          <div className="relative flex items-center px-6 py-10 lg:px-10 lg:-ml-10 lg:mb-[-40px] lg:self-end">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* FEATURED PROPERTIES */}
      <section className="px-6 lg:px-16 py-16">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-3xl text-ink">
            {featuredResult.items.length > 0 ? "Featured properties" : "Recently listed"}
          </h2>
          <Link href="/properties" className="text-lake-dark hover:underline">
            View all properties
          </Link>
        </div>

        {showcase.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcase.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="border border-line rounded-card p-12 text-center text-stone">
            No properties are published yet. Add one from the admin dashboard and it will
            appear here automatically.
          </div>
        )}
      </section>
    </main>
  );
}
