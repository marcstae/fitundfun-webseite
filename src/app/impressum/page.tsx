import Link from "next/link";
import { getSeite } from "@/lib/data";
import { sanitizeRichText } from "@/lib/sanitize";

export const revalidate = 300;
export const metadata = { title: "Impressum" };

const FALLBACK_CONTENT =
  '<p><strong>Verantwortlich für den Inhalt</strong><br>fit&amp;fun Familienlager Brigels<br>Lagerleitung: Andreas Locher</p><p>Fragen zur Website oder zum Lager beantworten wir über die <a href="/kontakt">Kontaktseite</a>.</p>';

export default async function ImpressumPage() {
  const seite = await getSeite("impressum");
  const titel = seite?.titel || "Impressum";
  const inhalt = seite?.inhalt || FALLBACK_CONTENT;
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
        fit&amp;fun Lager Brigels
      </p>
      <h1 className="camp-display mt-4 text-4xl leading-none text-ink sm:text-6xl">
        {titel}
      </h1>
      <div
        className="mt-10 space-y-4 rounded-[1.75rem] border border-ink/10 bg-white p-6 text-base font-semibold leading-relaxed text-ink/80 [&_a]:text-accent [&_a]:underline sm:p-8"
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(inhalt) }}
      />
      <div className="mt-8">
        <Link href="/" className="text-sm font-bold text-accent hover:underline">
          ← Zur Startseite
        </Link>
      </div>
    </div>
  );
}
