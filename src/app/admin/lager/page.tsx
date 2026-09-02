"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CalendarDays, Eye } from "lucide-react";
import { pbBrowser } from "@/lib/pb";
import type { LagerRecord } from "@/lib/pb-types";
import { formatDateRange } from "@/lib/utils";
import { NeuesLagerButton } from "@/components/edit/neues-lager-wizard";

export default function AdminLagerPage() {
  const search = useSearchParams();
  const [lager, setLager] = React.useState<LagerRecord[] | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    pbBrowser()
      .collection("lager")
      .getFullList<LagerRecord>({ sort: "-jahr" })
      .then(setLager)
      .catch(() => setError(true));
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Verwaltung</p>
          <h1 className="camp-display mt-2 text-4xl text-ink sm:text-5xl">Lager</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-muted">
            Entwürfe vorbereiten, Lager veröffentlichen und abgeschlossene Jahre archivieren.
          </p>
        </div>
        <NeuesLagerButton defaultOpen={search.get("neu") === "1"} />
      </div>

      {error ? (
        <p role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
          Die Lager konnten nicht geladen werden.
        </p>
      ) : !lager ? (
        <div className="mt-8 h-72 animate-pulse rounded-[1.75rem] bg-white/70" />
      ) : lager.length === 0 ? (
        <div className="mt-8 rounded-[1.75rem] border border-dashed border-ink/15 bg-white p-8 text-center">
          <h2 className="camp-display text-2xl text-ink">Noch kein Lager vorhanden</h2>
          <p className="mt-2 text-sm text-muted">Lege das erste Lager als Entwurf an.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white">
          <ul className="divide-y divide-ink/8">
            {lager.map((eintrag) => (
              <li key={eintrag.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="camp-display text-2xl text-ink">{eintrag.titel || `Lager ${eintrag.jahr}`}</span>
                    <StatusBadge status={eintrag.status} />
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-muted">
                    <CalendarDays className="size-4" />
                    {eintrag.datum_von && eintrag.datum_bis
                      ? formatDateRange(eintrag.datum_von, eintrag.datum_bis)
                      : "Zeitraum noch nicht erfasst"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/lager/${eintrag.jahr}${eintrag.status === "entwurf" ? "?vorschau=1" : ""}`}
                    target="_blank"
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink/10 px-4 text-sm font-bold text-ink hover:bg-sand"
                  >
                    <Eye className="size-4" /> Vorschau
                  </Link>
                  <Link
                    href={`/admin/lager/${eintrag.id}`}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white hover:bg-accent"
                  >
                    Bearbeiten <ArrowRight className="size-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: LagerRecord["status"] }) {
  const label =
    status === "entwurf" ? "Entwurf" : status === "archiviert" ? "Archiviert" : "Veröffentlicht";
  const style =
    status === "entwurf"
      ? "bg-amber-100 text-amber-900"
      : status === "archiviert"
        ? "bg-ink/8 text-ink/70"
        : "bg-emerald-100 text-emerald-800";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${style}`}>{label}</span>;
}
