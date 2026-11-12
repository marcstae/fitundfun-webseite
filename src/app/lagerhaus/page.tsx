import Link from "next/link";
import {
  ArrowUpRight,
  BedDouble,
  CookingPot,
  Gamepad2,
  Globe,
  MapPin,
  Mountain,
  Music,
  Snowflake,
  Sun,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { getEinstellungen, getSeite } from "@/lib/data";
import { publicFileUrl } from "@/lib/pb";
import { sanitizeRichText } from "@/lib/sanitize";

export const revalidate = 300;
export const metadata = {
  title: "Lagerhaus",
  description: "Ferienheim Albin in Brigels: Lage, Räume und Winterangebote rund ums Lagerhaus.",
};

const ADRESSE = "Via Cadruvi Sut 20, 7165 Breil/Brigels";
const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(`Ferienheim Albin, ${ADRESSE}`);
const HAUS_URL = "https://www.ferienheim-albin.ch/";

// Standardtext, solange die Lagerleitung im Cockpit keinen eigenen Text hinterlegt hat.
const EINLEITUNG =
  "<p>Das Ferienheim Albin liegt im alten Dorfkern von Brigels, ruhig auf einer Sonnenterrasse mit Blick auf die Bündner Berge. Hier schlafen, kochen, essen und verbringen wir die Abende gemeinsam. Skifahren, Schlitteln und Winterwandern beginnen direkt vor der Haustür: Die Talstation der Bergbahnen ist in 5 Minuten erreichbar.</p>";

const FAKTEN: [string, string][] = [
  ["bis 80", "Personen im Haus"],
  ["5 Min.", "bis zur Talstation"],
  ["40 km", "Piste, 5 Anlagen"],
  ["80 m²", "Aula für den Abend"],
];

const IM_HAUS: { icon: LucideIcon; titel: string; text: string }[] = [
  {
    icon: BedDouble,
    titel: "Schlafen",
    text: "Vierer- und Sechserzimmer auf mehreren Stockwerken, in jedem Zimmer ein Lavabo. Duschen und WC auf jedem Stock.",
  },
  {
    icon: UtensilsCrossed,
    titel: "Speisesaal",
    text: "Tische und Stühle für 80 Personen, grosse Garderobe und WLAN.",
  },
  {
    icon: CookingPot,
    titel: "Grossküche",
    text: "Professionell ausgestattet, mit Kombisteamer, Gastro-Geschirrspüler und grossem Kühlraum.",
  },
  {
    icon: Music,
    titel: "Aula",
    text: "80 m² für Musik, Tanz, Spiele, Film und Präsentationen – ideal für den Abend.",
  },
  {
    icon: Gamepad2,
    titel: "Spielzimmer",
    text: "60 m² mit zwei Tischfussballtischen und Tischtennis.",
  },
  {
    icon: Sun,
    titel: "Draussen",
    text: "Grosse Terrasse, Volleyballfeld, Fussballplatz und Tischtennis.",
  },
];

const IM_WINTER: { icon: LucideIcon; titel: string; text: string }[] = [
  {
    icon: Mountain,
    titel: "Bergbahnen Brigels",
    text: "Die Talstation ist in 5 Minuten erreichbar. Das Skigebiet hat 5 Anlagen und 40 km Piste.",
  },
  {
    icon: Snowflake,
    titel: "Talabfahrt bis zum Haus",
    text: "Die beschneite Talabfahrt führt direkt zurück zum Ferienheim.",
  },
  {
    icon: Users,
    titel: "Auch ohne Lift",
    text: "Skitouren und Winterwanderungen sind direkt ab Haus möglich. Für Kinder unter vier Jahren gibt es einen Skikindergarten in der Scoletta.",
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
          {FAKTEN.map(([zahl, text]) => (
            <li key={text} className="rounded-2xl bg-ink px-4 py-4 text-white">
              <span className="camp-display block text-3xl leading-none text-accent-light">{zahl}</span>
              <span className="mt-1.5 block text-sm font-semibold text-white/80">{text}</span>
            </li>
          ))}
        </ul>

        <Abschnitt titel="Im Haus" eintraege={IM_HAUS} />
        <Abschnitt titel="Im Winter ums Haus" eintraege={IM_WINTER} />

        <p className="px-1 text-xs text-muted">
          Angaben laut Website des Ferienheims. Weitere Informationen zum Haus gibt es dort.
        </p>

        <Link
          href="/kontakt"
          className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-ink transition hover:bg-white/70 active:bg-ink/5"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Fragen zum Lager?</span>
            <span className="block text-sm text-muted">Schreib der Lagerleitung</span>
          </span>
          <ArrowUpRight className="size-5 shrink-0 text-muted" aria-hidden />
        </Link>
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
