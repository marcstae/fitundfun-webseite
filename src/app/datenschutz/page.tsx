import Link from "next/link";
import { getSeite } from "@/lib/data";
import { sanitizeRichText } from "@/lib/sanitize";
import { EditableSeite } from "@/components/edit/editable-seite";

export const revalidate = 300;
export const metadata = { title: "Datenschutz" };

const FALLBACK_CONTENT =
  '<p>Diese Website verarbeitet nur Daten, die für den Betrieb und die Organisation des privaten Familienlagers erforderlich sind.</p><h2>Konten und Dokumente</h2><p>Login-Daten und Lagerdokumente werden in PocketBase gespeichert. Sensible Dokumente sind ausschliesslich für angemeldete Familienmitglieder und die Lagerleitung zugänglich.</p><h2>Server-Protokolle</h2><p>Beim Aufruf können technisch notwendige Server-Protokolle entstehen. Es werden keine Marketing- oder Analyse-Cookies eingesetzt.</p><h2>Externe Dienste</h2><p>Für verlinkte Foto-Alben, Videos, Karten und andere Websites gelten die Datenschutzerklärungen der jeweiligen Anbieter.</p>';

export default async function DatenschutzPage() {
  const seite = await getSeite("datenschutz");
  const inhalt = seite?.inhalt || FALLBACK_CONTENT;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h1 className="font-display text-3xl uppercase text-ink sm:text-4xl">Datenschutz</h1>
      <div
        className="mt-6 text-base leading-relaxed text-ink/80 [&_a]:text-accent [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:uppercase [&_h2]:text-ink [&_p+p]:mt-4"
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(inhalt) }}
      />
      <div className="mt-8">
        <EditableSeite slug="datenschutz" seite={seite} defaultTitel="Datenschutz" />
      </div>
      <div className="mt-8">
        <Link href="/" className="text-sm font-bold text-accent hover:underline">
          ← Zur Startseite
        </Link>
      </div>
    </div>
  );
}
