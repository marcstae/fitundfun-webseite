import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Play,
  UsersRound,
} from "lucide-react";
import { getLager } from "@/lib/data";
import { formatDateRange } from "@/lib/utils";
import { richTextToPlainText } from "@/lib/sanitize";
import type { LagerRecord } from "@/lib/pb-types";

export const revalidate = 300;

export const metadata = {
  title: "Lager-Archiv",
  description: "Alle fit&fun Familienlager in Brigels seit 2007.",
};

export default async function ArchivPage() {
  const lager = await getLager();
  const aktuelleLager = lager.filter((eintrag) => eintrag.status === "veroeffentlicht");
  const vergangeneLager = lager.filter((eintrag) => eintrag.status === "archiviert");
  const erstesJahr = vergangeneLager.at(-1)?.jahr || aktuelleLager.at(-1)?.jahr;
  const letztesJahr = aktuelleLager[0]?.jahr || vergangeneLager[0]?.jahr;

  return (
    <main className="bg-sand">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            {erstesJahr && letztesJahr ? `${erstesJahr} – ${letztesJahr}` : "Archiv"}
          </p>
          <h1 className="camp-display mt-4 text-4xl leading-none text-ink sm:text-6xl">
            Alle Lagerjahre
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-muted">
            Termine, Programme, Dokumente und Erinnerungen aus fast zwei Jahrzehnten
            fit&amp;fun in Brigels.
          </p>
        </header>

        {aktuelleLager.length > 0 ? (
          <section className="mt-12 sm:mt-16">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="font-display text-xl uppercase text-ink">Aktuelles Lager</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {aktuelleLager.map((eintrag) => (
                <CurrentCampCard key={eintrag.id} lager={eintrag} />
              ))}
            </div>
          </section>
        ) : null}

        {vergangeneLager.length > 0 ? (
          <section className="mt-16 sm:mt-20">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                  Rückblick
                </p>
                <h2 className="camp-display mt-2 text-3xl text-ink sm:text-4xl">
                  Vergangene Lager
                </h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {vergangeneLager.map((eintrag) => (
                <ArchivedCampCard key={eintrag.id} lager={eintrag} />
              ))}
            </div>
          </section>
        ) : null}

        {aktuelleLager.length === 0 && vergangeneLager.length === 0 ? (
          <p className="mt-12 text-sm text-muted">
            Noch keine Lager veröffentlicht.
          </p>
        ) : null}
      </div>
    </main>
  );
}

function CurrentCampCard({ lager }: { lager: LagerRecord }) {
  return (
    <Link
      href={`/lager/${lager.jahr}`}
      className="group flex min-h-52 flex-col justify-between rounded-[1.75rem] bg-ink p-6 text-white transition-transform hover:-translate-y-1 sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="camp-display text-5xl leading-none">{lager.jahr}</span>
        <ArrowUpRight className="size-5 text-accent-light transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <div>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/75">
          <CalendarDays className="size-4 text-accent-light" />
          {formatDateRange(lager.datum_von, lager.datum_bis)}
        </span>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Alle Informationen und Dokumente zum nächsten Lager.
        </p>
      </div>
    </Link>
  );
}

function ArchivedCampCard({ lager }: { lager: LagerRecord }) {
  const zeitraum =
    lager.datum_von && lager.datum_bis
      ? formatDateRange(lager.datum_von, lager.datum_bis)
      : null;

  return (
    <Link
      href={`/lager/${lager.jahr}`}
      className="group flex min-h-64 flex-col rounded-[1.75rem] border border-ink/10 bg-white p-6 transition hover:-translate-y-1 hover:border-ink/20 hover:shadow-[0_18px_45px_rgba(14,28,48,0.08)] sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="camp-display text-4xl leading-none text-ink">{lager.jahr}</span>
        <ArrowUpRight className="size-5 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>

      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">
        {zeitraum ? (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" /> {zeitraum}
          </span>
        ) : null}
        {lager.teilnehmer ? (
          <span className="inline-flex items-center gap-1.5">
            <UsersRound className="size-3.5" /> {lager.teilnehmer}
          </span>
        ) : null}
      </div>

      <p className="mt-5 line-clamp-3 text-sm font-semibold leading-relaxed text-muted">
        {richTextToPlainText(lager.beschreibung || "") || "Dokumente und Erinnerungen aus diesem Lagerjahr."}
      </p>

      <div className="mt-auto flex items-center gap-3 pt-6 text-xs font-bold text-ink/60">
        {lager.youtube_url ? (
          <span className="inline-flex items-center gap-1.5">
            <Play className="size-3.5" /> Video
          </span>
        ) : null}
        <span className="ml-auto text-accent">Details</span>
      </div>
    </Link>
  );
}
