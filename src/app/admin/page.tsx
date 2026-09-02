"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  FileText,
  Images,
  Plus,
  Video,
} from "lucide-react";
import { pbBrowser } from "@/lib/pb";
import type { DokumentRecord, FotoalbumRecord, LagerRecord } from "@/lib/pb-types";

export default function AdminDashboard() {
  const [data, setData] = React.useState<{
    lager: LagerRecord[];
    dokumente: DokumentRecord[];
    fotoalben: FotoalbumRecord[];
  } | null>(null);
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
    ])
      .then(([lager, dokumente, fotoalben]) => setData({ lager, dokumente, fotoalben }))
      .catch(() => setError(true));
  }, []);

  const fokus =
    data?.lager.find((lager) => lager.status === "veroeffentlicht") ||
    data?.lager.find((lager) => lager.status === "entwurf") ||
    data?.lager[0];
  const docs = fokus
    ? data?.dokumente.filter((dokument) => dokument.lager === fokus.id) || []
    : [];
  const album = fokus
    ? data?.fotoalben.some((fotoalbum) => fotoalbum.lager === fokus.id)
    : false;
  const checks = fokus
    ? [
        { label: "Zeitraum", ok: !!fokus.datum_von && !!fokus.datum_bis, icon: CalendarDays },
        { label: "Beschreibung", ok: !!fokus.beschreibung?.trim(), icon: FileText },
        { label: "Dokumente", ok: docs.length > 0, icon: FileText },
        { label: "Fotoalbum", ok: album, icon: Images },
        { label: "Video", ok: !!fokus.youtube_url, icon: Video },
      ]
    : [];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Cockpit</p>
          <h1 className="camp-display mt-2 text-4xl text-ink sm:text-5xl">Übersicht</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-muted">
            Lager vorbereiten, Inhalte pflegen und den Veröffentlichungsstatus prüfen.
          </p>
        </div>
        <Link
          href="/admin/lager?neu=1"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-white hover:bg-ink"
        >
          <Plus className="size-4" /> Neues Lager
        </Link>
      </div>

      {error ? (
        <div role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
          Die Übersicht konnte nicht geladen werden. Bitte die Seite neu laden.
        </div>
      ) : !data ? (
        <div className="mt-8 h-64 animate-pulse rounded-[1.75rem] bg-white/70" />
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Stat label="Entwürfe" value={data.lager.filter((l) => l.status === "entwurf").length} />
            <Stat label="Veröffentlicht" value={data.lager.filter((l) => l.status === "veroeffentlicht").length} />
            <Stat label="Archiviert" value={data.lager.filter((l) => l.status === "archiviert").length} />
          </div>

          {fokus ? (
            <section className="mt-6 rounded-[1.75rem] border border-ink/10 bg-white p-6 sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Im Fokus</p>
                  <h2 className="camp-display mt-2 text-3xl text-ink">{fokus.titel || `Lager ${fokus.jahr}`}</h2>
                  <p className="mt-2 text-sm font-semibold text-muted">Status: {statusLabel(fokus.status)}</p>
                </div>
                <Link href={`/admin/lager/${fokus.id}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline">
                  Lager bearbeiten <ArrowRight className="size-4" />
                </Link>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {checks.map((check) => (
                  <div key={check.label} className="rounded-xl bg-sand px-4 py-3">
                    <span className="flex items-center gap-2 text-sm font-bold text-ink">
                      {check.ok ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <CircleAlert className="size-4 text-amber-600" />
                      )}
                      {check.label}
                    </span>
                    <span className="mt-1 block text-xs text-muted">{check.ok ? "Vorhanden" : "Fehlt noch"}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="mt-6 rounded-[1.75rem] border border-dashed border-ink/15 bg-white p-8 text-center">
              <h2 className="camp-display text-2xl text-ink">Noch kein Lager vorhanden</h2>
              <p className="mt-2 text-sm text-muted">Lege zuerst ein Lager als Entwurf an.</p>
            </section>
          )}

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <QuickLink href="/admin/website" title="Website-Inhalte" description="Startseite, Lagerhaus und Rechtstexte bearbeiten" />
            <QuickLink href="/admin/organisation" title="Organisation" description="Sponsoren, Kontakte und nützliche Links verwalten" />
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5">
      <span className="camp-display text-3xl text-ink">{value}</span>
      <span className="mt-1 block text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
    </div>
  );
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="group rounded-2xl border border-ink/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-ink/20">
      <span className="flex items-center justify-between gap-3 font-display text-xl text-ink">
        {title} <ArrowRight className="size-4 text-accent transition group-hover:translate-x-0.5" />
      </span>
      <span className="mt-2 block text-sm font-semibold text-muted">{description}</span>
    </Link>
  );
}

function statusLabel(status: LagerRecord["status"]) {
  if (status === "entwurf") return "Entwurf";
  if (status === "archiviert") return "Archiviert";
  return "Veröffentlicht";
}
