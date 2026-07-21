import Link from "next/link";
import { getSeite } from "@/lib/data";
import { sanitizeRichText } from "@/lib/sanitize";
import { EditableSeite } from "@/components/edit/editable-seite";

export const revalidate = 300;
export const metadata = { title: "Impressum" };

export default async function ImpressumPage() {
  const seite = await getSeite("impressum");
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h1 className="font-display text-3xl uppercase text-ink sm:text-4xl">Impressum</h1>
      {seite?.inhalt ? (
        <div
          className="mt-6 text-base leading-relaxed text-ink/80 [&_a]:text-accent [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(seite.inhalt) }}
        />
      ) : (
        <p className="mt-6 text-sm text-muted">
          Inhalte werden im Bearbeitungsmodus gepflegt.
        </p>
      )}
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
