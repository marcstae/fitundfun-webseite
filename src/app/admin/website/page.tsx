import { AkzentfarbeSettings } from "@/components/admin/akzentfarbe-settings";
import { HeroSettings } from "@/components/admin/hero-settings";
import { getEinstellungen } from "@/lib/data";

export default async function AdminWebsitePage() {
  const settings = await getEinstellungen();

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Darstellung</p>
      <h1 className="camp-display mt-2 text-4xl text-ink sm:text-5xl">Website</h1>
      <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-muted">
        Startseite und Farbe der ganzen Website. Texte der Seiten Lagerhaus und Kontakt stehen unter «Inhaltsseiten».
      </p>

      <div className="mt-8 space-y-6">
        <HeroSettings initial={settings} />
        <AkzentfarbeSettings initial={settings} />
      </div>
    </div>
  );
}
