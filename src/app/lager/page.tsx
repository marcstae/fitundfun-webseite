import Link from "next/link";
import { Plus } from "lucide-react";
import { getLager, getArchiv } from "@/lib/data";
import { formatDateRange } from "@/lib/utils";
import { NeuesLagerButton } from "@/components/edit/neues-lager-wizard";
import { ArchivManager } from "@/components/edit/archiv-manager";
import type { ArchivRecord, LagerRecord } from "@/lib/pb-types";

export const revalidate = 300;

export const metadata = {
  title: "Lager-Archiv",
  description: "Alle Lager des fit&fun Skilagers Brigels — vergangene Jahre als Linkliste.",
};

export default async function ArchivPage() {
  const [lager, archiv] = await Promise.all([getLager(), getArchiv()]);
  const sorted = [...lager].sort((a, b) => b.jahr - a.jahr);
  const alt = [...archiv].sort((a, b) => b.jahr - a.jahr);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="mb-10">
        <h1 className="font-display text-3xl uppercase text-ink sm:text-4xl">Archiv</h1>
        <p className="mt-2 text-sm text-muted">
          Alle Lager seit 2007 — neue Jahre als Karten, ältere als Linkliste.
        </p>
      </header>

      {sorted.length > 0 && (
        <section className="mb-14">
          <div className="mb-6">
            <NeuesLagerButton />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((l) => (
              <LagerCard key={l.id} lager={l} />
            ))}
          </div>
        </section>
      )}

      {alt.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg uppercase text-muted">
            2007 – {alt[0].jahr + 1}
          </h2>
          <ul className="divide-y divide-ink/8 border-y border-ink/10">
            {alt.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm"
              >
                <span className="font-display text-lg text-ink">{a.jahr}</span>
                {a.video_url && (
                  <a
                    href={a.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    ▶ Video
                  </a>
                )}
                {a.fotos_url && (
                  <a
                    href={a.fotos_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    📷 Fotos
                  </a>
                )}
                {!a.video_url && !a.fotos_url && (
                  <span className="text-muted">— keine Links hinterlegt</span>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <ArchivManager existing={alt} />
          </div>
        </section>
      )}

      {sorted.length === 0 && alt.length === 0 && (
        <p className="text-sm text-muted">
          Noch keine Lager erfasst. Im Bearbeitungsmodus kannst du ein neues Lager anlegen.
        </p>
      )}
    </div>
  );
}

function LagerCard({ lager }: { lager: LagerRecord }) {
  return (
    <Link
      href={`/lager/${lager.jahr}`}
      className="group flex flex-col gap-2 rounded-2xl border border-ink/10 p-6 transition hover:border-accent/40 hover:shadow-md"
    >
      <span className="font-display text-4xl leading-none text-ink transition group-hover:text-accent">
        {lager.jahr}
      </span>
      <span className="text-sm text-muted">{formatDateRange(lager.datum_von, lager.datum_bis)}</span>
    </Link>
  );
}

export type { ArchivRecord };
