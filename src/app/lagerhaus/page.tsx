import { ArrowUpRight, Globe, MapPin } from "lucide-react";
import { INHALT_ICONS } from "@/components/inhalt-icons";
import { getEinstellungen, getSeite } from "@/lib/data";
import { type Eintrag, LAGERHAUS_EINLEITUNG, LAGERHAUS_TITEL, lagerhausInhalt, mapsUrl } from "@/lib/inhaltsseiten";
import { publicFileUrl } from "@/lib/pb";
import { sanitizeRichText } from "@/lib/sanitize";

export const revalidate = 300;
export const metadata = {
  title: "Lagerhaus",
  description: "Unser Lagerhaus in Brigels: Bettzeug, Verpflegung, Anreise und praktische Infos für unser Familienlager.",
};

export default async function LagerhausPage() {
  const [seite, einstellungen] = await Promise.all([
    getSeite("lagerhaus"),
    getEinstellungen().catch(() => null),
  ]);
  // Alles ist im Cockpit unter «Inhaltsseiten» bearbeitbar.
  const haus = lagerhausInhalt(seite?.daten);
  const einleitung = sanitizeRichText(seite?.inhalt || LAGERHAUS_EINLEITUNG);
  // Eigenes Kopfbild (erstes Bild der Seite), sonst das Vorschaubild der Startseite.
  const kopfbild = seite?.bilder?.[0]
    ? publicFileUrl("seiten", seite.id, seite.bilder[0])
    : einstellungen?.hero_poster
      ? publicFileUrl("einstellungen", einstellungen.id, einstellungen.hero_poster)
      : "/hero-poster.jpg";

  return (
    <div className="bg-sand pb-10">
      <div className="mx-auto max-w-2xl px-3 pt-3 sm:px-6 sm:pt-6">
        <header className="relative isolate overflow-hidden rounded-[1.75rem] bg-navy-900 text-white">
          <img
            src={kopfbild}
            alt=""
            aria-hidden
            className="absolute inset-0 -z-20 size-full object-cover object-[50%_40%]"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-950 via-navy-950/75 to-navy-950/10" />
          <div className="px-5 pb-5 pt-24 sm:px-8 sm:pb-8 sm:pt-36">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-light">
              {seite?.titel || LAGERHAUS_TITEL}
            </p>
            <h1 className="camp-display mt-1.5 text-[2.5rem] leading-none sm:text-6xl">{haus.name}</h1>
            <p className="mt-3 flex items-center gap-2 text-[0.95rem] font-semibold text-white/90">
              <MapPin className="size-4 shrink-0 text-accent-light" aria-hidden />
              {haus.adresse}
            </p>
          </div>
        </header>
      </div>

      <div className="mx-auto max-w-2xl space-y-8 px-3 pt-3 sm:space-y-10 sm:px-6">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <a
            href={mapsUrl(haus)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-16 items-center gap-3 rounded-2xl bg-accent px-5 py-3 text-white transition hover:bg-ink active:bg-ink"
          >
            <MapPin className="size-6 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-bold">In Google Maps öffnen</span>
              <span className="block text-sm text-white/80">Lage und Route</span>
            </span>
            <ArrowUpRight className="size-5 shrink-0 text-white/70" aria-hidden />
          </a>
          {haus.website ? (
            <a
              href={haus.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-16 items-center gap-3 rounded-2xl bg-white px-5 py-3 text-ink transition hover:bg-white/70 active:bg-ink/5"
            >
              <Globe className="size-6 shrink-0 text-accent" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-bold">Website des Hauses</span>
                <span className="block truncate text-sm text-muted">
                  {new URL(haus.website).hostname.replace(/^www\./, "")}
                </span>
              </span>
              <ArrowUpRight className="size-5 shrink-0 text-muted" aria-hidden />
            </a>
          ) : null}
        </div>

        <div
          className="wrap-break-word rounded-2xl bg-white p-5 text-base leading-relaxed text-ink/85 sm:p-6 [&_a]:font-semibold [&_a]:text-accent [&_a]:underline [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: einleitung }}
        />

        {haus.fakten.length > 0 ? (
          <ul aria-label="Kurzfakten" className="grid grid-cols-2 gap-2.5">
            {haus.fakten.map(({ icon, titel, text }, index) => {
              const Icon = INHALT_ICONS[icon];
              return (
                <li key={index} className="rounded-2xl bg-ink px-4 py-4 text-white">
                  <Icon className="mb-2 size-6 text-accent-light" aria-hidden />
                  <span className="block font-bold leading-snug text-accent-light">{titel}</span>
                  {text ? <span className="mt-1.5 block text-sm text-white/80">{text}</span> : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {haus.infos.length > 0 ? <Abschnitt titel={haus.infosTitel} eintraege={haus.infos} /> : null}

        {haus.hinweis ? <p className="px-1 text-xs text-muted">{haus.hinweis}</p> : null}
      </div>
    </div>
  );
}

function Abschnitt({ titel, eintraege }: { titel: string; eintraege: Eintrag[] }) {
  return (
    <section>
      <h2 className="camp-display mb-3 px-1 text-2xl text-ink">{titel}</h2>
      <ul className="divide-y divide-ink/[0.07] overflow-hidden rounded-2xl bg-white">
        {eintraege.map(({ icon, titel: t, text }, index) => {
          const Icon = INHALT_ICONS[icon];
          return (
            <li key={index} className="flex gap-3.5 px-4 py-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-bold leading-snug text-ink">{t}</span>
                {text ? <span className="mt-0.5 block text-sm leading-relaxed text-muted">{text}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
