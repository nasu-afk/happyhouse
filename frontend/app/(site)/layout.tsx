import { api } from "@/lib/api";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, areas] = await Promise.all([
    api.settings.get(),
    api.areas.list().catch(() => []),
  ]);

  return (
    <>
      <Header settings={settings} />
      {children}
      <Footer settings={settings} areas={areas} />
    </>
  );
}
