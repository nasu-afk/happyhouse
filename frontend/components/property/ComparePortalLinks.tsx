/**
 * Outbound "compare elsewhere" links.
 *
 * 99acres/MagicBricks/Housing.com don't offer a public API, and their
 * internal search-URL formats change and require portal-specific numeric
 * IDs we can't reliably guess. Rather than link to something that might be
 * a dead page, we use a site-scoped web search — it always resolves to
 * real, current results for the right locality.
 */
const PORTALS = [
  { name: "99acres", domain: "99acres.com" },
  { name: "MagicBricks", domain: "magicbricks.com" },
  { name: "Housing.com", domain: "housing.com" },
] as const;

export function ComparePortalLinks({ locality, city, propertyType }: {
  locality: string;
  city: string;
  propertyType: string;
}) {
  const query = (domain: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(`site:${domain} ${propertyType} ${locality} ${city}`)}`;

  return (
    <div className="mt-10 border-t border-line pt-8">
      <h2 className="font-display text-xl text-ink mb-3">Compare elsewhere</h2>
      <p className="text-sm text-stone mb-3">
        See similar {propertyType}s in {locality} on other portals:
      </p>
      <div className="flex flex-wrap gap-2">
        {PORTALS.map((portal) => (
          <a
            key={portal.domain}
            href={query(portal.domain)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="border border-line rounded-card px-3 py-1.5 text-sm text-stone hover:border-lake hover:text-lake-dark transition-colors"
          >
            {portal.name} ↗
          </a>
        ))}
      </div>
    </div>
  );
}
