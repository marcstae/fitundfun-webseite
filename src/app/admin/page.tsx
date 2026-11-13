"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Eye,
  FileText,
  Images,
  Video,
} from "lucide-react";
import { pbBrowser } from "@/lib/pb";
import type { DokumentRecord, LagerpasswortRecord, FotoalbumRecord, LagerRecord } from "@/lib/pb-types";
import { fokusLager, formatDateRange } from "@/lib/utils";

type Daten = {
  lager: LagerRecord[];
  dokumente: DokumentRecord[];
  fotoalben: FotoalbumRecord[];
  lagerpasswortGesetzt: boolean;
};

export default function AdminDashboard() {
  const [data, setData] = React.useState<Daten | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const pb = pbBrowser();
    Promise.all([
      pb.collection("lager").getFullList<LagerRecord>({ sort: "-jahr" }),
      Promise.all([
        pb.collection("dokumente").getFullList<DokumentRecord>(),
        pb.collection("dokumente_intern").getFullList<DokumentRecord>(),
      ]).then(([publicDocs, privateDocs]) => [...publicDocs, ...privateDocs]),
      pb.collection("fotoalben").getFullList<FotoalbumRecord>(),
      pb.collection("lagerpasswort").getList<LagerpasswortRecord>(1, 1),
    ])
      .then(([lager, dokumente, fotoalben, lagerpasswort]) =>
        setData({ lager, dokumente, fotoalben, lagerpasswortGesetzt: !!lagerpasswort.items[0]?.password_hash })
      )
      .catch(() => setError(true));
  }, []);

  const anzahl = (status: LagerRecord["status"]) => data?.lager.filter((l) => l.status === status).length ?? 0;
  const fokus = data ? fokusLager(data.lager, new Date().getFullYear()) : null;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Cockpit</p>
      <h1 className="camp-display mt-2 text-4xl text-ink sm:text-5xl">Übersicht</h1>
      <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-muted">
        Welches Lager in Vorbereitung ist, welches auf der Website aktiv ist und was noch fehlt.
      </p>

      {error ? (
        <div role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
          Die Übersicht konnte nicht geladen werden. Bitte die Seite neu laden.
        </div>
      ) : !data || !fokus ? (
        <div className="mt-8 h-64 animate-pulse rounded-[1.75rem] bg-white/70" />
      ) : (
        <>
          {!data.lagerpasswortGesetzt ? (
            <Link
              href="/admin/konto"
              className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900"
            >
              <span>Noch kein Lagerpasswort gesetzt – geschützte Dokumente sind für Teilnehmende noch nicht erreichbar.</span>
              <ArrowRight className="size-4 shrink-0" />
            </Link>
          ) : null}

          <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-4">
            <Stat label="Lager im Entwurf" value={anzahl("entwurf")} />
            <Stat label="Aktuelle aktive Lager" value={anzahl("veroeffentlicht")} />
            <Stat label="Vergangene archivierte Lager" value={anzahl("archiviert")} />
          </div>

          <h2 className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-muted">Im Fokus</h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <FokusKarte
              art="Im Entwurf"
              farbe="bg-amber-100 text-amber-900"
              lager={fokus.entwurf}
              weitere={fokus.weitereEntwuerfe}
              data={data}
              leer={
                <>
                  Zurzeit ist kein Lager in Vorbereitung. Neue Lager legst du im Tab{" "}
                  <Link href="/admin/lager" className="font-bold text-accent hover:underline">Lager</Link> an.
                </>
              }
            />
            <FokusKarte
              art="Aktiv auf der Website"
              farbe="bg-emerald-100 text-emerald-800"
              lager={fokus.aktiv}
              data={data}
              hinweis="Es ist immer nur ein Lager aktiv. Wird ein Entwurf veröffentlicht, wird dieses Lager automatisch archiviert."
              leer="Kein Lager veröffentlicht. Startseite und Menü zeigen deshalb kein aktuelles Lager."
            />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-2xl border border-ink/10 bg-white p-3 sm:p-5">
      <span className="camp-display text-2xl text-ink sm:text-3xl">{value}</span>
      <span className="mt-1 block text-xs font-bold leading-snug text-muted sm:text-sm">{label}</span>
    </div>
  );
}

function FokusKarte({
  art,
  farbe,
  lager,
  weitere = [],
  data,
  hinweis,
  leer,
}: {
  art: string;
  farbe: string;
  lager: LagerRecord | null;
  /** Weitere Entwürfe ausser dem im Fokus (aktiv ist immer nur eines). */
  weitere?: LagerRecord[];
  data: Daten;
  hinweis?: string;
  leer: React.ReactNode;
}) {
  if (!lager) {
    return (
      <section className="rounded-[1.5rem] border border-dashed border-ink/15 bg-white p-5 sm:p-6">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${farbe}`}>{art}</span>
        <p className="mt-4 text-sm font-semibold leading-relaxed text-muted">{leer}</p>
      </section>
    );
  }

  const checks = [
    { label: "Zeitraum", ok: !!lager.datum_von && !!lager.datum_bis, icon: CalendarDays },
    { label: "Beschreibung", ok: !!lager.beschreibung?.trim(), icon: FileText },
    { label: "Dokumente", ok: data.dokumente.some((d) => d.lager === lager.id), icon: FileText },
    { label: "Fotoalbum", ok: data.fotoalben.some((f) => f.lager === lager.id), icon: Images },
    { label: "Video", ok: !!lager.youtube_url, icon: Video },
  ];
  const vorhanden = checks.filter((check) => check.ok).length;

  return (
    <section className="flex flex-col rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-6">
      <span className={`self-start rounded-full px-2.5 py-1 text-xs font-bold ${farbe}`}>{art}</span>
      {/* Jahr statt Titel: Alle Lager heissen gleich, unterscheiden sich nur im Jahr. */}
      <h3 className="camp-display mt-3 text-3xl text-ink">Lager {lager.jahr}</h3>
      <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-muted">
        <CalendarDays className="size-4 shrink-0" />
        {lager.datum_von && lager.datum_bis
          ? formatDateRange(lager.datum_von, lager.datum_bis)
          : "Zeitraum noch nicht erfasst"}
      </p>

      <p className="mt-5 text-sm font-bold text-ink">{vorhanden} von {checks.length} Angaben vorhanden</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {checks.map((check) => (
          <li key={check.label} className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-sm font-bold text-ink">
            {check.ok ? (
              <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
            ) : (
              <CircleAlert className="size-4 text-amber-600" aria-hidden />
            )}
            {check.label}
            <span className="sr-only">{check.ok ? "vorhanden" : "fehlt noch"}</span>
          </li>
        ))}
      </ul>

      {weitere.length > 0 ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">
            {weitere.length === 1 ? "1 weiterer Entwurf" : `${weitere.length} weitere Entwürfe`}
          </p>
          <p className="mt-1 leading-relaxed">Im Fokus steht der nächste anstehende Entwurf.</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {weitere.map((l) => (
              <li key={l.id}>
                <Link href={`/admin/lager/${l.id}`} className="inline-flex min-h-8 items-center gap-1 font-bold underline-offset-2 hover:underline">
                  Lager {l.jahr} <ArrowRight className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {hinweis ? <p className="mt-5 text-sm leading-relaxed text-muted">{hinweis}</p> : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-6">
        <Link
          href={`/admin/lager/${lager.id}`}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white hover:bg-accent"
        >
          Bearbeiten <ArrowRight className="size-4" />
        </Link>
        <Link
          href={`/lager/${lager.jahr}${lager.status === "entwurf" ? "?vorschau=1" : ""}`}
          target="_blank"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink/10 px-4 text-sm font-bold text-ink hover:bg-sand"
        >
          <Eye className="size-4" /> {lager.status === "entwurf" ? "Vorschau" : "Ansehen"}
        </Link>
      </div>
    </section>
  );
}
