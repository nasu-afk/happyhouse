import { api } from "@/lib/api";
import { PropertyCard } from "@/components/property/PropertyCard";
import { FilterPanel } from "@/components/property/FilterPanel";
import type { PropertySearchParams } from "@/lib/types";
import Link from "next/link";

export const metadata = { title: "Properties" };
export const dynamic = "force-dynamic";

const SORT_OPTIONS: { value: NonNullable<PropertySearchParams["sort"]>; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "area_asc", label: "Area: Low to High" },
  { value: "area_desc", label: "Area: High to Low" },
];

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const params: PropertySearchParams = {
    listing_type: searchParams.listing_type as PropertySearchParams["listing_type"],
    property_type: searchParams.property_type as PropertySearchParams["property_type"],
    locality: searchParams.locality,
    min_price: searchParams.min_price ? Number(searchParams.min_price) : undefined,
    max_price: searchParams.max_price ? Number(searchParams.max_price) : undefined,
    bedrooms: searchParams.bedrooms ? Number(searchParams.bedrooms) : undefined,
    furnishing_status: searchParams.furnishing_status as PropertySearchParams["furnishing_status"],
    parking: searchParams.parking,
    sort: (searchParams.sort as PropertySearchParams["sort"]) || "newest",
    page: searchParams.page ? Number(searchParams.page) : 1,
  };

  const result = await api.properties.list(params);

  function pageHref(page: number) {
    const usp = new URLSearchParams(searchParams as Record<string, string>);
    usp.set("page", String(page));
    return `/properties?${usp.toString()}`;
  }

  return (
    <main className="px-6 lg:px-16 py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Properties</h1>
          <p className="text-stone mt-1">{result.total} properties found</p>
        </div>

        <form className="flex items-center gap-2" action="/properties">
          {Object.entries(searchParams)
            .filter(([key]) => key !== "sort")
            .map(([key, value]) =>
              value ? <input key={key} type="hidden" name={key} value={value} /> : null
            )}
          <label className="text-sm text-stone" htmlFor="sort">Sort by</label>
          <select
            id="sort"
            name="sort"
            defaultValue={params.sort}
            className="border border-line rounded-card px-3 py-2 bg-paper text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </form>
      </div>

      <div className="flex gap-10">
        <FilterPanel />

        <div className="flex-1 min-w-0">
          {result.items.length === 0 ? (
            <div className="border border-line rounded-card p-16 text-center text-stone">
              No properties match your search. Try widening your filters.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {result.items.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}

          {result.total_pages > 1 && (
            <nav className="flex justify-center gap-2 mt-12" aria-label="Pagination">
              {Array.from({ length: result.total_pages }, (_, i) => i + 1).map((page) => (
                <Link
                  key={page}
                  href={pageHref(page)}
                  className={`w-9 h-9 flex items-center justify-center rounded-card text-sm ${
                    page === result.page ? "bg-ink text-paper" : "border border-line text-ink"
                  }`}
                >
                  {page}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </main>
  );
}
