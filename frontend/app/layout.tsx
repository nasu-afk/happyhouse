import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "next-themes";
import { FavoritesProvider } from "@/components/providers/FavoritesProvider";
import { CompareProvider } from "@/components/providers/CompareProvider";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  // Relative image paths (openGraph/twitter images below, and any page's
  // generateMetadata) resolve against this. Without it, Next.js silently
  // falls back to its own internal dev address (e.g. localhost:8080 on
  // Railway) — meaning link previews shared on WhatsApp/social would try
  // to load an image from an address only reachable inside the container.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://happyhouse.example.com"),
  title: {
    default: "HappyHouse | Property Consultancy in Thane",
    template: "%s | HappyHouse",
  },
  description: "Find a place you'll love to call home. Explore properties across Thane with HappyHouse Property Consultancy.",
  openGraph: {
    siteName: "HappyHouse",
    type: "website",
    images: [{ url: "/logo.png", width: 1080, height: 1080, alt: "HappyHouse" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plexSans.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ToastProvider>
            <FavoritesProvider>
              <CompareProvider>{children}</CompareProvider>
            </FavoritesProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
