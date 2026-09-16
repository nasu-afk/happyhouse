import Link from "next/link";
import { api } from "@/lib/api";

export const metadata = { title: "About" };
export const dynamic = "force-dynamic";

const PILLARS = [
  {
    title: "Local expertise",
    body: "Every recommendation is grounded in knowing Thane's neighborhoods — not a generic citywide listing feed.",
  },
  {
    title: "Straightforward process",
    body: "No jargon, no pressure. Clear next steps at every stage, from shortlisting to paperwork.",
  },
  {
    title: "Built on trust",
    body: "Every listing shown here is real and current — nothing published just to pad the numbers.",
  },
];

export default async function AboutPage() {
  const [settings, areas] = await Promise.all([api.settings.get(), api.areas.list()]);

  return (
    <main className="max-w-5xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
      <div className="max-w-prose mb-12">
        <h1 className="font-display text-4xl text-ink mb-4">About {settings.business_name}</h1>
        <p className="text-ink/90 leading-relaxed">
          {settings.about_text || "A property consultancy built around Thane — helping people buy, sell, and rent with someone who actually knows the local market."}
        </p>
        {settings.consultant_name && (
          <p className="text-stone mt-4">Your consultant: <span className="text-ink">{settings.consultant_name}</span></p>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-8 mb-14 border-t border-line pt-10">
        {PILLARS.map((p) => (
          <div key={p.title}>
            <h2 className="font-display text-lg text-ink mb-2">{p.title}</h2>
            <p className="text-stone text-sm leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>

      {areas.length > 0 && (
        <div className="mb-14 border-t border-line pt-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl text-ink">Areas we serve</h2>
            <Link href="/areas" className="text-sm text-lake-dark hover:underline">See all →</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {areas.map((area) => (
              <Link
                key={area.id}
                href={`/properties?locality=${encodeURIComponent(area.name)}`}
                className="border border-line rounded-card px-3 py-1.5 text-sm hover:border-lake transition-colors"
              >
                {area.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-line pt-10 flex flex-wrap gap-4">
        <Link href="/contact" className="bg-ink text-paper px-6 py-3 rounded-card font-medium hover:bg-lake-dark transition-colors">
          Get in touch
        </Link>
        <Link href="/properties" className="border border-line px-6 py-3 rounded-card font-medium hover:border-lake transition-colors">
          Browse properties
        </Link>
      </div>
    </main>
  );
}
