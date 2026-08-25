import Link from "next/link";
import { getSeite } from "@/lib/data";
import { sanitizeRichText } from "@/lib/sanitize";
import { EditableSeite } from "@/components/edit/editable-seite";

export const revalidate = 300;
export const metadata = { title: "Impressum" };

const FALLBACK_CONTENT =
  '<p><strong>Verantwortlich für den Inhalt</strong><br>fit&amp;fun Familienlager Brigels<br>Lagerleitung: Andreas Locher</p><p>Fragen zur Website oder zum Lager beantworten wir über die <a href="/kontakt">Kontaktseite</a>.</p>';

export default async function ImpressumPage() {
  const seite = await getSeite("impressum");
  const inhalt = seite?.inhalt || FALLBACK_CONTENT;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h1 className="font-display text-3xl uppercase text-ink sm:text-4xl">Impressum</h1>
      <div
        className="mt-6 space-y-4 text-base leading-relaxed text-ink/80 [&_a]:text-accent [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(inhalt) }}
      />
      <div className="mt-8">
        <EditableSeite slug="impressum" seite={seite} defaultTitel="Impressum" />
      </div>
      <div className="mt-8">
        <Link href="/" className="text-sm font-bold text-accent hover:underline">
          ← Zur Startseite
        </Link>
      </div>
    </div>
  );
}
