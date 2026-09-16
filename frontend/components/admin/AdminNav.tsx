"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/properties", label: "Properties" },
  { href: "/admin/areas", label: "Areas" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await api.auth.logout();
    router.push("/admin/login");
  }

  return (
    <header className="bg-night text-cream px-6 lg:px-10 py-4 flex items-center justify-between">
      <nav className="flex gap-7 items-center">
        <span className="font-display text-lg mr-2">HappyHouse</span>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm pb-0.5 border-b-2 transition-colors ${
              pathname === link.href
                ? "border-lake-light text-cream"
                : "border-transparent text-cream/60 hover:text-cream"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <ThemeToggle className="border-cream/20 text-cream hover:border-lake-light" />
        <button onClick={handleLogout} className="text-sm text-cream/60 hover:text-cream transition-colors">
          Log out
        </button>
      </div>
    </header>
  );
}
