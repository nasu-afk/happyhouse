import type { MetadataRoute } from "next";
import { api } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://happyhouse.example.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/properties`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/services`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    // Pull every published property, page by page, into the sitemap.
    const first = await api.properties.list({ page: 1, page_size: 48 });
    const pages = [first];
    for (let p = 2; p <= first.total_pages; p++) {
      pages.push(await api.properties.list({ page: p, page_size: 48 }));
    }
    const propertyRoutes: MetadataRoute.Sitemap = pages.flatMap((page) =>
      page.items.map((property) => ({
        url: `${SITE_URL}/properties/${property.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
    );
    return [...staticRoutes, ...propertyRoutes];
  } catch {
    // Backend unreachable at build time — ship the static routes rather than fail the build.
    return staticRoutes;
  }
}
