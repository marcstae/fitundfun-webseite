import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { getSeite } from "@/lib/data";
import { sanitizeRichText } from "@/lib/sanitize";

export const revalidate = 300;
export const metadata = { title: "Lagerhaus" };

const FALLBACK_CONTENT = `
  <p>Das Ferienheim Albin – Casa Crestneder ist seit vielen Jahren unser Zuhause während der Lagerwoche.</p>
  <p>Hier schlafen, kochen, essen und verbringen wir die Abende gemeinsam. Das Haus liegt in Brigels und bietet kurze Wege ins Dorf und ins Wintersportgebiet.</p>
  <ul>
    <li>Ferienheim Albin, Casa Crestneder, 7165 Brigels</li>
    <li>Gemeinschaftsräume für Essen, Spiele und Abendprogramm</li>
    <li>Bettzeug ist vollständig vorhanden</li>
  </ul>
`;

export default async function LagerhausPage() {
  const seite = await getSeite("lagerhaus");
  const titel = seite?.titel || "Unser Lagerhaus";
  const inhalt = sanitizeRichText(seite?.inhalt || FALLBACK_CONTENT);

  return (
    <main className="bg-sand">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Casa Crestneder
        </p>
        <h1 className="camp-display mt-4 text-4xl leading-none text-ink sm:text-6xl">
          {titel}
        </h1>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_0.55fr]">
          <div className="rounded-[1.75rem] bg-white p-6 sm:p-8">
            <div
              className="text-base font-semibold leading-relaxed text-ink/80 [&_a]:text-accent [&_a]:underline [&_p+p]:mt-4 [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: inhalt }}
            />
          </div>

          <div className="flex flex-col justify-between rounded-[1.75rem] bg-ink p-6 text-white sm:p-8">
            <MapPin className="size-8 text-accent-light" />
            <div>
              <h2 className="camp-display text-3xl">Brigels</h2>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-white/65">
                Lage des Ferienheims auf der historischen Lagerkarte.
              </p>
              <a
                href="https://www.google.com/maps?q=46.769060887157934,9.062191843986511"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-accent-light"
              >
                Auf der Karte ansehen <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-sm font-bold text-accent hover:underline">
            ← Zur Startseite
          </Link>
        </div>
      </div>
    </main>
  );
}
