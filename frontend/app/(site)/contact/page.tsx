import { api } from "@/lib/api";
import { EnquiryForm } from "@/components/property/EnquiryForm";
import { EmbeddedMap } from "@/components/property/EmbeddedMap";
import { geocodeAddress } from "@/lib/geocode";

export const metadata = { title: "Contact" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await api.settings.get();
  const hours = settings.business_hours ? Object.entries(settings.business_hours) : [];
  const coords = settings.address ? await geocodeAddress(settings.address) : null;

  const details = [
    settings.phone && { label: "Phone", value: settings.phone, href: `tel:${settings.phone}` },
    settings.whatsapp && { label: "WhatsApp", value: settings.whatsapp, href: `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}` },
    settings.email && { label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    settings.address && { label: "Address", value: settings.address },
  ].filter(Boolean) as { label: string; value: string; href?: string }[];

  return (
    <main className="max-w-5xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
      <div className="max-w-prose mb-10">
        <h1 className="font-display text-4xl text-ink mb-3">Contact</h1>
        <p className="text-stone">
          Have a question about a property, or want local guidance on buying, selling, or renting in Thane?
          Reach out directly, or send a message and we&apos;ll get back to you.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-10">
        <div className="space-y-8">
          {details.length > 0 ? (
            <div className="border border-line rounded-card divide-y divide-line">
              {details.map((d) => (
                <div key={d.label} className="flex items-center justify-between px-5 py-4">
                  <span className="text-sm text-stone">{d.label}</span>
                  {d.href ? (
                    <a href={d.href} className="text-ink font-medium hover:text-lake-dark transition-colors">{d.value}</a>
                  ) : (
                    <span className="text-ink font-medium text-right">{d.value}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-line rounded-card px-5 py-6 text-sm text-stone">
              Contact details haven&apos;t been added yet — send a message using the form and we&apos;ll follow up.
            </div>
          )}

          {hours.length > 0 && (
            <div>
              <h2 className="text-sm text-stone mb-2">Business hours</h2>
              <dl className="text-ink text-sm space-y-1">
                {hours.map(([day, time]) => (
                  <div key={day} className="flex justify-between max-w-xs">
                    <dt className="capitalize text-stone">{day.replace(/_/g, " ")}</dt>
                    <dd>{time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {coords ? (
            <EmbeddedMap latitude={coords.lat} longitude={coords.lon} zoomDelta={0.01} label={settings.address ?? undefined} />
          ) : (
            <div className="aspect-[16/9] bg-line rounded-card flex items-center justify-center text-stone text-sm text-center px-6">
              {settings.address ? `Couldn't locate this address on the map yet` : "A map will appear here once an address is added in Settings"}
            </div>
          )}
        </div>

        <div className="border border-line rounded-card p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-display text-xl text-ink mb-4">Send a message</h2>
          <EnquiryForm />
        </div>
      </div>
    </main>
  );
}
