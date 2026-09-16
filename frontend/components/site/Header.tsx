"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { SiteSettings } from "@/lib/types";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useFavorites } from "@/components/providers/FavoritesProvider";
import { useCompare } from "@/components/providers/CompareProvider";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Properties" },
  { href: "/areas", label: "Areas" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { favorites } = useFavorites();
  const { compareList } = useCompare();

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-line">
      <div className="px-6 lg:px-16 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
          <Image src="/logo.png" alt={settings.business_name} width={160} height={104} className="h-11 w-auto" priority />
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm pb-0.5 border-b-2 transition-colors ${
                  active ? "border-lake text-ink" : "border-transparent text-stone hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {compareList.length > 0 && (
            <Link href="/compare" className="relative text-stone hover:text-ink transition-colors" aria-label="Compare properties">
              <svg width="19" height="19" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="2" y="3" width="5" height="10" rx="1" />
                <rect x="9" y="3" width="5" height="10" rx="1" />
              </svg>
              <span className="absolute -top-2 -right-2 bg-lake text-paper text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {compareList.length}
              </span>
            </Link>
          )}
          <Link href="/favorites" className="relative text-stone hover:text-ink transition-colors" aria-label="Saved properties">
            <svg width="19" height="19" viewBox="0 0 16 16" fill={favorites.length > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4">
              <path d="M8 14s-6-3.6-6-8.2C2 3 4 1.5 6.2 1.5 7.3 1.5 8 2.2 8 2.2S8.7 1.5 9.8 1.5C12 1.5 14 3 14 5.8 14 10.4 8 14 8 14Z" strokeLinejoin="round" />
            </svg>
            {favorites.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-lake text-paper text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </Link>
          <ThemeToggle />
          {settings.phone ? (
            <a
              href={`tel:${settings.phone}`}
              className="bg-ink text-paper px-4 py-2 rounded-card text-sm font-medium hover:bg-lake-dark transition-colors"
            >
              Call {settings.phone}
            </a>
          ) : (
            <Link
              href="/contact"
              className="bg-ink text-paper px-4 py-2 rounded-card text-sm font-medium hover:bg-lake-dark transition-colors"
            >
              Talk to a consultant
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span className={`block w-5 h-px bg-ink transition-transform ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
            <span className={`block w-5 h-px bg-ink transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-px bg-ink transition-transform ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-line px-6 py-4 flex flex-col gap-4 bg-paper">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`text-base ${pathname.startsWith(link.href) && link.href !== "/" ? "text-lake-dark" : "text-ink"}`}
            >
              {link.label}
            </Link>
          ))}
          {settings.phone && (
            <a href={`tel:${settings.phone}`} className="bg-ink text-paper px-4 py-2.5 rounded-card text-sm font-medium text-center">
              Call {settings.phone}
            </a>
          )}
          <div className="flex gap-4 pt-2 border-t border-line">
            <Link href="/favorites" onClick={() => setMenuOpen(false)} className="text-ink text-sm">
              Saved {favorites.length > 0 && `(${favorites.length})`}
            </Link>
            <Link href="/compare" onClick={() => setMenuOpen(false)} className="text-ink text-sm">
              Compare {compareList.length > 0 && `(${compareList.length})`}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
