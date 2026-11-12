import {
  ArrowUpRight,
  BedDouble,
  Gamepad2,
  Globe,
  MapPin,
  Footprints,
  Moon,
  Car,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { getEinstellungen, getSeite } from "@/lib/data";
import { publicFileUrl } from "@/lib/pb";
import { sanitizeRichText } from "@/lib/sanitize";
import { LAGERHAUS_ADRESSE as ADRESSE, LAGERHAUS_MAPS_URL as MAPS_URL } from "@/lib/site";

export const revalidate = 300;
export const metadata = {
  title: "Lagerhaus",
  description: "Ferienheim Albin in Brigels: Bettzeug, Verpflegung, Anreise und praktische Infos für unser Familienlager.",
};

const HAUS_URL = "https://www.ferienheim-albin.ch/";

// Standardtext, solange die Lagerleitung im Cockpit keinen eigenen Text hinterlegt hat.
const EINLEITUNG =
  "<p>Das Ferienheim Albin in Brigels ist unser Zuhause während der Lagerwoche. Hier essen wir gemeinsam und verbringen die Abende mit Spielen und Lagerprogramm.</p>";

const FAKTEN: { icon: LucideIcon; titel: string; text: string }[] = [
  { icon: BedDouble, titel: "Bettzeug vorhanden", text: "Kein Bettanzug oder Schlafsack nötig" },
  { icon: Footprints, titel: "Hausschuhe mitnehmen", text: "Im Haus Pflicht; Turnschuhe sind auch okay" },
  { icon: UtensilsCrossed, titel: "3 Mahlzeiten", text: "In der Lagerpauschale inbegriffen" },
  { icon: Moon, titel: "Ab 22 Uhr", text: "Nachtruhe, ausser im Aufenthaltsraum und Keller" },
];

const LAGERINFOS: { icon: LucideIcon; titel: string; text: string }[] = [
  {
    icon: Car,
    titel: "Ankommen & parkieren",
    text: "Individuelle Anreise am Samstag, Hausbezug ab 16 Uhr. Zum Ausladen kurz vor dem Haus halten, danach auf dem Gemeindeparkplatz beim Restaurant Tödi parkieren.",
  },
  {
    icon: UtensilsCrossed,
    titel: "Lunch für die Piste",
    text: "Am Vorabend bei der Küche anmelden und einen Tagesrucksack mitbringen. Tee steht immer bereit, die Kaffeemaschine ist gratis nutzbar.",
  },
  {
    icon: BedDouble,
    titel: "Zusammen im Haus",
    text: "Essen und Trinken gehören in die Gemeinschaftsräume. Im ganzen Haus und auf den Balkonen gilt Rauchverbot. Zimmerwechsel bitte mit der Lagerleitung absprechen.",
  },
  {
    icon: Gamepad2,
    titel: "Für die Lagerabende",
    text: "Spiele, Bücher oder ein Musikinstrument sind willkommen. Für Tischtennis eigene Schläger und Bälle mitbringen; Beamer und Soundanlage sind vorhanden.",
  },
];

export default async function LagerhausPage() {
  const [seite, einstellungen] = await Promise.all([
    getSeite("lagerhaus"),
    getEinstellungen().catch(() => null),
  ]);
  const einleitung = sanitizeRichText(seite?.inhalt || EINLEITUNG);
  const kopfbild = einstellungen?.hero_poster
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
              {seite?.titel || "Unser Lagerhaus"}
            </p>
            <h1 className="camp-display mt-1.5 text-[2.5rem] leading-none sm:text-6xl">Ferienheim Albin</h1>
            <p className="mt-3 flex items-center gap-2 text-[0.95rem] font-semibold text-white/90">
              <MapPin className="size-4 shrink-0 text-accent-light" aria-hidden />
              {ADRESSE}
            </p>
          </div>
        </header>
      </div>

      <div className="mx-auto max-w-2xl space-y-8 px-3 pt-3 sm:space-y-10 sm:px-6">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <a
            href={MAPS_URL}
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
          <a
            href={HAUS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-16 items-center gap-3 rounded-2xl bg-white px-5 py-3 text-ink transition hover:bg-white/70 active:bg-ink/5"
          >
            <Globe className="size-6 shrink-0 text-accent" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-bold">Website des Ferienheims</span>
              <span className="block text-sm text-muted">ferienheim-albin.ch</span>
            </span>
            <ArrowUpRight className="size-5 shrink-0 text-muted" aria-hidden />
          </a>
        </div>

        <div
          className="wrap-break-word rounded-2xl bg-white p-5 text-base leading-relaxed text-ink/85 sm:p-6 [&_a]:font-semibold [&_a]:text-accent [&_a]:underline [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: einleitung }}
        />

        <ul aria-label="Kurzfakten" className="grid grid-cols-2 gap-2.5">
          {FAKTEN.map(({ icon: Icon, titel, text }) => (
            <li key={titel} className="rounded-2xl bg-ink px-4 py-4 text-white">
              <Icon className="mb-2 size-6 text-accent-light" aria-hidden />
              <span className="block font-bold leading-snug text-accent-light">{titel}</span>
              <span className="mt-1.5 block text-sm text-white/80">{text}</span>
            </li>
          ))}
        </ul>

        <Abschnitt titel="Gut zu wissen fürs Lager" eintraege={LAGERINFOS} />

        <p className="px-1 text-xs text-muted">
          Stand: Lagerunterlagen 2026. Für künftige Lager gelten die jeweiligen aktuellen Lagerinfos.
        </p>

      </div>
    </div>
  );
}

function Abschnitt({
  titel,
  eintraege,
}: {
  titel: string;
  eintraege: { icon: LucideIcon; titel: string; text: string }[];
}) {
  return (
    <section>
      <h2 className="camp-display mb-3 px-1 text-2xl text-ink">{titel}</h2>
      <ul className="divide-y divide-ink/[0.07] overflow-hidden rounded-2xl bg-white">
        {eintraege.map(({ icon: Icon, titel: t, text }) => (
          <li key={t} className="flex gap-3.5 px-4 py-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-bold leading-snug text-ink">{t}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
