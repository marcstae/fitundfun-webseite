import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { KontaktEditor, LagerhausEditor } from "@/components/admin/inhaltsseiten-editor";
import { EditableLinks } from "@/components/edit/editable-links";
import { GruppenManager, KontakteManager } from "@/components/edit/kontakte-manager";
import { getKontaktgruppen, getKontakte, getSeite } from "@/lib/data";
import { INHALTSSEITEN_BEREICHE } from "@/lib/inhaltsseiten";

export const metadata = { title: "Inhaltsseiten" };

// Die Bereiche wählt man links in der Navigation unter «Inhaltsseiten» (admin-shell);
// ohne Auswahl öffnet der erste (Kontakt).
export default async function AdminInhaltsseitenPage({
  searchParams,
}: {
  searchParams: Promise<{ bereich?: string }>;
}) {
  const { bereich: gewaehlt } = await searchParams;
  const bereich = INHALTSSEITEN_BEREICHE.find((b) => b.key === gewaehlt) ?? INHALTSSEITEN_BEREICHE[0];

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Inhaltsseiten</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <h1 className="camp-display text-4xl text-ink sm:text-5xl">{bereich.label}</h1>
        {bereich.seite ? (
          <Link href={bereich.seite} target="_blank" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-accent hover:underline">
            Seite ansehen <ExternalLink className="size-4" />
          </Link>
        ) : null}
      </div>
      <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-muted">{bereich.text}</p>

      <div className="mt-6 sm:mt-8">
        {bereich.key === "kontakt" ? (
          <KontaktBereich />
        ) : bereich.key === "lagerhaus" ? (
          <LagerhausEditor seite={await getSeite("lagerhaus")} />
        ) : (
          <Kasten titel="Links" text="Änderungen hier werden sofort gespeichert.">
            <EditableLinks />
          </Kasten>
        )}
      </div>
    </div>
  );
}

async function KontaktBereich() {
  const [seite, kontakte, gruppen] = await Promise.all([getSeite("kontakt"), getKontakte(), getKontaktgruppen()]);
  return (
    <div className="space-y-5">
      <KontaktEditor seite={seite} />
      <Kasten titel="Kontaktpersonen" text="Name, E-Mail und Telefon, je öffentlich oder nur mit Lagerpasswort. Änderungen hier werden sofort gespeichert.">
        <KontakteManager existing={kontakte} gruppen={gruppen} />
      </Kasten>
      <Kasten titel="Gruppen" text="Überschriften über den Kontaktpersonen, in dieser Reihenfolge. Eine Gruppe ohne Kontakte erscheint nicht auf der Seite.">
        <GruppenManager existing={gruppen} kontakte={kontakte} />
      </Kasten>
    </div>
  );
}

function Kasten({ titel, text, children }: { titel: string; text: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-6">
      <h2 className="font-display text-xl text-ink">{titel}</h2>
      <p className="mt-1 text-sm font-semibold leading-relaxed text-muted">{text}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
