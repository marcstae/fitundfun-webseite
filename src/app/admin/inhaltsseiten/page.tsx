import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { KontaktEditor, LagerhausEditor } from "@/components/admin/inhaltsseiten-editor";
import { EditableLinks } from "@/components/edit/editable-links";
import { KontakteManager } from "@/components/edit/kontakte-manager";
import { getKontakte, getSeite } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata = { title: "Inhaltsseiten" };

// Gegliedert danach, wo der Inhalt auf der Website erscheint; je Bereich eigenes Speichern.
const BEREICHE = [
  { key: "lagerhaus", label: "Lagerhaus", text: "Haus, Adresse, Kurzfakten und Infos fürs Lager.", seite: "/lagerhaus" },
  { key: "kontakt", label: "Kontakt", text: "Text der Kontaktseite und die Kontaktpersonen.", seite: "/kontakt" },
  { key: "links", label: "Nützliche Links", text: "Erscheinen auf jeder Lagerseite unter «Nützliche Links».", seite: null },
] as const;

export default async function AdminInhaltsseitenPage({
  searchParams,
}: {
  searchParams: Promise<{ bereich?: string }>;
}) {
  const { bereich: gewaehlt } = await searchParams;
  const bereich = BEREICHE.find((b) => b.key === gewaehlt) ?? BEREICHE[0];

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Inhalte</p>
      <h1 className="camp-display mt-2 text-4xl text-ink sm:text-5xl">Inhaltsseiten</h1>
      <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-muted">
        Alles, was auf den Seiten Lagerhaus und Kontakt steht, und die nützlichen Links der Lagerseiten.
      </p>

      <nav aria-label="Bereiche" className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-ink/10 bg-white p-1 sm:mt-8 sm:inline-flex">
        {BEREICHE.map((b) => (
          <Link
            key={b.key}
            href={`/admin/inhaltsseiten?bereich=${b.key}`}
            aria-current={b.key === bereich.key ? "page" : undefined}
            className={cn(
              "inline-flex h-11 shrink-0 items-center rounded-xl px-4 text-sm font-bold whitespace-nowrap transition",
              b.key === bereich.key ? "bg-ink text-white" : "text-muted hover:bg-sand hover:text-ink"
            )}
          >
            {b.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h2 className="camp-display text-3xl text-ink">{bereich.label}</h2>
          <p className="mt-1 text-sm font-semibold text-muted">{bereich.text}</p>
        </div>
        {bereich.seite ? (
          <Link href={bereich.seite} target="_blank" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-accent hover:underline">
            Seite ansehen <ExternalLink className="size-4" />
          </Link>
        ) : null}
      </div>

      <div className="mt-5">
        {bereich.key === "lagerhaus" ? (
          <LagerhausEditor seite={await getSeite("lagerhaus")} />
        ) : bereich.key === "kontakt" ? (
          <div className="space-y-5">
            <KontaktEditor seite={await getSeite("kontakt")} />
            <section className="rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-6">
              <h3 className="font-display text-xl text-ink">Kontaktpersonen</h3>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-muted">
                Name, E-Mail und Telefon, je öffentlich oder nur mit Lagerpasswort. Änderungen hier werden sofort gespeichert.
              </p>
              <div className="mt-5">
                <KontakteManager existing={await getKontakte()} />
              </div>
            </section>
          </div>
        ) : (
          <section className="rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-6">
            <p className="text-sm font-semibold leading-relaxed text-muted">Änderungen hier werden sofort gespeichert.</p>
            <div className="mt-5">
              <EditableLinks />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
