import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";

export const metadata = { title: "Areas We Serve" };
export const dynamic = "force-dynamic";

export default async function AreasPage() {
  const areas = await api.areas.list();

  return (
    <main className="px-6 lg:px-16 py-16">
      <h1 className="font-display text-4xl text-ink mb-3">Areas we serve</h1>
      <p className="text-stone max-w-prose mb-12">
        HappyHouse works across these localities in Thane. Pick one to see current listings.
      </p>

      {areas.length === 0 ? (
        <div className="border border-line rounded-card p-16 text-center text-stone">
          Areas will appear here once they&apos;re added from the admin dashboard.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((area) => (
            <Link
              key={area.id}
              href={`/properties?locality=${encodeURIComponent(area.name)}`}
              className="group block border border-line rounded-card overflow-hidden hover:border-lake transition-colors"
            >
              <div className="relative aspect-[4/3] bg-gradient-to-br from-lake-dark to-lake overflow-hidden">
                {area.image_url ? (
                  <Image
                    src={area.image_url}
                    alt={area.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <>
                    <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 300 225" fill="none">
                      <path d="M 20,180 C -10,140 5,80 90,60 C 175,40 260,60 280,120 C 300,175 250,210 180,215 C 100,220 40,210 20,180 Z" stroke="#F6F4EE" strokeWidth="1.5" />
                      <path d="M 0,195 C -35,145 -15,70 80,45 C 190,15 290,45 315,115 C 340,180 275,220 195,230 C 100,240 25,230 0,195 Z" stroke="#F6F4EE" strokeWidth="1.5" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-display text-2xl text-paper/90">{area.name}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-display text-lg text-ink">{area.name}</h2>
                {area.description && (
                  <p className="text-sm text-stone mt-1 line-clamp-2">{area.description}</p>
                )}
                <span className="text-sm text-lake-dark mt-2 inline-block">View properties</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
