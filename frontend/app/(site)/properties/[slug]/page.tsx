import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { EnquiryForm } from "@/components/property/EnquiryForm";
import { ComparePortalLinks } from "@/components/property/ComparePortalLinks";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { PropertyCard } from "@/components/property/PropertyCard";
import { EmbeddedMap } from "@/components/property/EmbeddedMap";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const property = await api.properties.bySlug(slug);
    const description = property.description?.slice(0, 155) || `${property.property_type} in ${property.locality}, Thane`;
    const image = property.images[0]?.image_url;
    return {
      title: `${property.title} | ${property.locality}, Thane`,
      description,
      openGraph: {
        title: property.title,
        description,
        type: "website",
        images: image ? [{ url: image, width: 1200, height: 900, alt: property.title }] : undefined,
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title: property.title,
        description,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return { title: "Property not found" };
  }
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [property, settings] = await Promise.all([
    api.properties.bySlug(slug).catch(() => null),
    api.settings.get(),
  ]);

  if (!property) notFound();

  // Similar properties: same locality first (most relevant to a buyer/
  // renter comparing options), falling back to same property type if
  // the locality doesn't have enough other listings.
  let similar = (await api.properties.list({ locality: property.locality, page_size: 5 }))
    .items.filter((p) => p.slug !== property.slug);
  if (similar.length < 3) {
    const byType = (await api.properties.list({ property_type: property.property_type, page_size: 5 }))
      .items.filter((p) => p.slug !== property.slug);
    const seen = new Set(similar.map((p) => p.id));
    similar = [...similar, ...byType.filter((p) => !seen.has(p.id))];
  }
  similar = similar.slice(0, 3);

  const whatsappMessage = encodeURIComponent(
    `Hello, I am interested in the ${property.title} in ${property.locality}, Thane listed on ${settings.business_name}.`
  );
  const whatsappHref = settings.whatsapp
    ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${whatsappMessage}`
    : null;

  const specs: [string, string | number | null][] = [
    ["Bedrooms", property.bedrooms],
    ["Bathrooms", property.bathrooms],
    ["Balconies", property.balconies],
    ["Area", property.area_sqft ? `${property.area_sqft} sq.ft` : null],
    ["Carpet area", property.carpet_area_sqft ? `${property.carpet_area_sqft} sq.ft` : null],
    ["Floor", property.floor],
    ["Total floors", property.total_floors],
    ["Furnishing", property.furnishing_status?.replace("_", " ") ?? null],
    ["Parking", property.parking],
  ];

  return (
    <main className="pb-24 lg:pb-0">
      {/*
        Structured data (schema.org/RealEstateListing) — this is how listing
        aggregators and Google actually discover and understand property
        data across the web; it's the legitimate counterpart to what an
        API/feed integration would do.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: property.title,
            description: property.description || undefined,
            url: `https://happyhouse.example.com/properties/${property.slug}`,
            image: property.images.map((img) => img.image_url),
            datePosted: property.created_at,
            offers: {
              "@type": "Offer",
              price: property.price,
              priceCurrency: "INR",
              availability:
                property.status === "available"
                  ? "https://schema.org/InStock"
                  : "https://schema.org/SoldOut",
              businessFunction:
                property.listing_type === "buy"
                  ? "http://purl.org/goodrelations/v1#Sell"
                  : "http://purl.org/goodrelations/v1#LeaseOut",
            },
            address: {
              "@type": "PostalAddress",
              addressLocality: property.locality,
              addressRegion: property.city,
              addressCountry: "IN",
            },
            numberOfRooms: property.bedrooms || undefined,
            numberOfBathroomsTotal: property.bathrooms || undefined,
            floorSize: property.area_sqft
              ? { "@type": "QuantitativeValue", value: property.area_sqft, unitCode: "FTK" }
              : undefined,
          }),
        }}
      />

      {/* Gallery */}
      <PropertyGallery images={property.images} title={property.title} />

      <div className="px-6 lg:px-16 py-10 grid lg:grid-cols-[1fr_360px] gap-12">
        <div>
          <div className="flex items-center gap-2 text-sm text-stone mb-2">
            <span>{property.listing_type === "buy" ? "For sale" : "For rent"}</span>
            <span aria-hidden>·</span>
            <span className="capitalize">{property.property_type}</span>
          </div>
          <h1 className="font-display text-3xl lg:text-4xl text-ink">{property.title}</h1>
          <p className="text-stone mt-2">{property.locality}, {property.city}, {property.district}</p>
          <p className="font-display text-2xl text-lake-dark mt-4">
            {property.price_display || `₹${Number(property.price).toLocaleString("en-IN")}`}
          </p>

          {/* Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 mt-8 border-t border-line pt-8">
            {specs.filter(([, v]) => v !== null && v !== undefined).map(([label, value]) => (
              <div key={label}>
                <div className="text-xs text-stone">{label}</div>
                <div className="text-ink capitalize">{value}</div>
              </div>
            ))}
          </div>

          {property.description && (
            <div className="mt-10 border-t border-line pt-8">
              <h2 className="font-display text-xl text-ink mb-3">About this property</h2>
              <p className="text-ink/90 max-w-prose leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
          )}

          {property.amenities.length > 0 && (
            <div className="mt-10 border-t border-line pt-8">
              <h2 className="font-display text-xl text-ink mb-3">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <span key={amenity} className="border border-line rounded-card px-3 py-1.5 text-sm">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {property.location_privacy !== "locality_only" && property.latitude && property.longitude && (
            <div className="mt-10 border-t border-line pt-8">
              <h2 className="font-display text-xl text-ink mb-3">Location</h2>
              <EmbeddedMap
                latitude={property.latitude}
                longitude={property.longitude}
                zoomDelta={property.location_privacy === "approximate" ? 0.03 : 0.008}
                label={property.title}
              />
            </div>
          )}

          <ComparePortalLinks
            locality={property.locality}
            city={property.city}
            propertyType={property.property_type}
          />
        </div>

        {/* Enquiry sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="border border-line rounded-card p-6 sticky top-6">
            <h2 className="font-display text-xl text-ink mb-4">Enquire about this property</h2>
            <EnquiryForm propertyId={property.id} />
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block text-center border border-line rounded-card py-3 font-medium hover:border-lake transition-colors"
              >
                Message on WhatsApp
              </a>
            )}
            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="mt-3 block text-center bg-ink text-paper rounded-card py-3 font-medium hover:bg-lake-dark transition-colors"
              >
                Call {settings.consultant_name || settings.business_name}
              </a>
            )}
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <div className="px-6 lg:px-16 pb-16">
          <h2 className="font-display text-2xl text-ink mb-6 border-t border-line pt-10">Similar properties</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similar.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </div>
      )}

      {/* Sticky mobile action bar (spec §38) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-paper border-t border-line p-3 flex gap-2 z-10">
        {settings.phone && (
          <a href={`tel:${settings.phone}`} className="flex-1 text-center bg-ink text-paper rounded-card py-3 font-medium">
            Call
          </a>
        )}
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex-1 text-center border border-line rounded-card py-3 font-medium">
            WhatsApp
          </a>
        )}
        <a href="#enquire" className="flex-1 text-center border border-line rounded-card py-3 font-medium">
          Enquire
        </a>
      </div>
    </main>
  );
}
