import Link from "next/link";
import Image from "next/image";
import type { SiteSettings, Area } from "@/lib/types";

export function Footer({ settings, areas }: { settings: SiteSettings; areas: Area[] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-night text-cream mt-24">
      <div className="px-6 lg:px-16 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Image src="/logo.png" alt={settings.business_name} width={48} height={48} className="h-12 w-auto mb-3" />
          {settings.tagline && <p className="text-cream/70 text-sm">{settings.tagline}</p>}
        </div>

        <div>
          <h3 className="text-sm text-cream/50 mb-3">Quick links</h3>
          <ul className="space-y-2 text-sm">
            {[
              { href: "/properties", label: "Properties" },
              { href: "/areas", label: "Areas we serve" },
              { href: "/services", label: "Services" },
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-cream/80 hover:text-cream transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {areas.length > 0 && (
          <div>
            <h3 className="text-sm text-cream/50 mb-3">Areas we serve</h3>
            <ul className="space-y-2 text-sm">
              {areas.slice(0, 6).map((area) => (
                <li key={area.id}>
                  <Link
                    href={`/properties?locality=${encodeURIComponent(area.name)}`}
                    className="text-cream/80 hover:text-cream transition-colors"
                  >
                    {area.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-sm text-cream/50 mb-3">Contact</h3>
          <ul className="space-y-2 text-sm text-cream/80">
            {settings.phone && <li><a href={`tel:${settings.phone}`} className="hover:text-cream transition-colors">{settings.phone}</a></li>}
            {settings.email && <li><a href={`mailto:${settings.email}`} className="hover:text-cream transition-colors">{settings.email}</a></li>}
            {settings.address && <li className="text-cream/60">{settings.address}</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10 px-6 lg:px-16 py-5 text-xs text-cream/40">
        © {year} {settings.business_name}. All rights reserved.
      </div>
    </footer>
  );
}
