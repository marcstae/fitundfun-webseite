"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EditableDokumentList } from "@/components/edit/editable-dokument-list";
import { EditableImmich } from "@/components/edit/editable-immich";
import { MinimalEditor } from "@/components/edit/minimal-editor";
import { useSaveAction } from "@/components/edit/save-dialog";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { isValidHttpUrl, isoToDateInput } from "@/lib/utils";
import type {
  DokumentRecord,
  FotoalbumRecord,
  LagerPublikationsstatus,
  LagerRecord,
} from "@/lib/pb-types";

interface LoadedData {
  lager: LagerRecord;
  dokumente: DokumentRecord[];
  fotoalbum: FotoalbumRecord | null;
}

export function LagerEditor({ id }: { id: string }) {
  const router = useRouter();
  const [loaded, setLoaded] = React.useState<LoadedData | null>(null);
  const [loadError, setLoadError] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [jahr, setJahr] = React.useState("");
  const [titel, setTitel] = React.useState("");
  const [von, setVon] = React.useState("");
  const [bis, setBis] = React.useState("");
  const [beschreibung, setBeschreibung] = React.useState("");
  const [teilnehmer, setTeilnehmer] = React.useState("");
  const [aktivitaeten, setAktivitaeten] = React.useState("");
  const [videoUrl, setVideoUrl] = React.useState("");
  const [quelleUrl, setQuelleUrl] = React.useState("");
  const [status, setStatus] = React.useState<LagerPublikationsstatus>("entwurf");
  const { saving, run } = useSaveAction();

  React.useEffect(() => {
    const pb = pbBrowser();
    Promise.all([
      pb.collection("lager").getOne<LagerRecord>(id),
      pb.collection("dokumente").getFullList<DokumentRecord>({ filter: `lager = "${id}"`, sort: "sort,name" }),
      pb.collection("dokumente_intern").getFullList<DokumentRecord>({ filter: `lager = "${id}"`, sort: "sort,name" }),
      pb.collection("fotoalben").getList<FotoalbumRecord>(1, 1, { filter: `lager = "${id}"` }),
    ])
      .then(([lager, publicDocs, privateDocs, albums]) => {
        setLoaded({
          lager,
          dokumente: [
            ...publicDocs.map((document) => ({ ...document, sensibel: false, collection: "dokumente" as const })),
            ...privateDocs.map((document) => ({ ...document, sensibel: true, collection: "dokumente_intern" as const })),
          ].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)),
          fotoalbum: albums.items[0] || null,
        });
        setJahr(String(lager.jahr));
        setTitel(lager.titel || "");
        setVon(dateInput(lager.datum_von));
        setBis(dateInput(lager.datum_bis));
        setBeschreibung(lager.beschreibung || "");
        setTeilnehmer(lager.teilnehmer ? String(lager.teilnehmer) : "");
        setAktivitaeten((lager.aktivitaeten || []).join("\n"));
        setVideoUrl(lager.youtube_url || "");
        setQuelleUrl(lager.quelle_url || "");
        setStatus(lager.status || "entwurf");
      })
      .catch(() => setLoadError(true));
  }, [id]);

  React.useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    // Klicks auf Links und «Abmelden» abfangen: Next-Navigation löst kein beforeunload aus.
    // Capture-Phase auf document läuft vor den React-Handlern.
    // ponytail: Der Zurück-Knopf des Browsers (popstate) wird nicht abgefangen.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = (event.target as Element | null)?.closest('a[href]:not([target="_blank"]), [data-leave-guard]');
      if (target && !window.confirm("Ungespeicherte Änderungen verwerfen?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const change = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setter(value);
    setDirty(true);
  };

  const save = async () => {
    const numericYear = Number(jahr);
    if (!numericYear || numericYear < 1900 || numericYear > 2100) {
      toast.error("Bitte ein gültiges Lagerjahr eingeben.");
      return;
    }
    if (!titel.trim()) {
      toast.error("Bitte einen Titel eingeben.");
      return;
    }
    if (status === "veroeffentlicht" && (!von || !bis)) {
      toast.error("Vor dem Veröffentlichen braucht das Lager einen Zeitraum.");
      return;
    }
    if (von && bis && new Date(bis) < new Date(von)) {
      toast.error("Das Enddatum muss nach dem Startdatum liegen.");
      return;
    }
    if (videoUrl && !isValidHttpUrl(videoUrl)) {
      toast.error("Der Video-Link ist ungültig.");
      return;
    }
    if (quelleUrl && !isValidHttpUrl(quelleUrl)) {
      toast.error("Der Link zur historischen Quelle ist ungültig.");
      return;
    }

    const previousYear = loaded!.lager.jahr;
    let previousPublished: LagerRecord[] = [];
    const ok = await run(async () => {
      const pb = pbBrowser();
      if (status === "veroeffentlicht") {
        previousPublished = await pb.collection("lager").getFullList<LagerRecord>({
          filter: `status = "veroeffentlicht" && id != "${id}"`,
        });
      }

      try {
        await Promise.all(
          previousPublished.map((lager) =>
            pb.collection("lager").update(lager.id, { status: "archiviert" })
          )
        );
        const updated = await pb.collection("lager").update<LagerRecord>(id, {
          jahr: numericYear,
          titel: titel.trim(),
          datum_von: von ? new Date(von).toISOString() : "",
          datum_bis: bis ? new Date(bis).toISOString() : "",
          beschreibung,
          teilnehmer: teilnehmer ? Number(teilnehmer) : null,
          aktivitaeten: aktivitaeten.split("\n").map((item) => item.trim()).filter(Boolean),
          youtube_url: videoUrl.trim(),
          quelle_url: quelleUrl.trim(),
          status,
        });
        setLoaded((current) => current ? { ...current, lager: updated } : current);
      } catch (error) {
        await Promise.allSettled(
          previousPublished.map((lager) =>
            pb.collection("lager").update(lager.id, { status: "veroeffentlicht" })
          )
        );
        throw error;
      }
      await revalidatePath("/");
      await revalidatePath("/lager");
      await revalidatePath(`/lager/${previousYear}`);
      await Promise.all(
        previousPublished.map((lager) => revalidatePath(`/lager/${lager.jahr}`))
      );
      if (numericYear !== previousYear) await revalidatePath(`/lager/${numericYear}`);
    }, "Speichern fehlgeschlagen — ist das Lagerjahr bereits vorhanden?");
    if (ok) {
      setDirty(false);
      router.refresh();
    }
  };

  const remove = async () => {
    if (!loaded) return;
    const answer = window.prompt(
      `Dieses Lager und alle zugehörigen Dokumente werden endgültig gelöscht. Zum Bestätigen ${loaded.lager.jahr} eingeben:`
    );
    if (answer !== String(loaded.lager.jahr)) return;
    try {
      await pbBrowser().collection("lager").delete(id);
      await revalidatePath("/");
      await revalidatePath("/lager");
      toast.success("Lager gelöscht");
      router.replace("/admin/lager");
      router.refresh();
    } catch {
      toast.error("Das Lager konnte nicht gelöscht werden.");
    }
  };

  if (loadError) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
        Das Lager konnte nicht geladen werden. <Link href="/admin/lager" className="underline">Zurück zur Übersicht</Link>
      </div>
    );
  }
  if (!loaded) return <div className="h-[32rem] animate-pulse rounded-[1.75rem] bg-white/70" />;

  const previewHref = `/lager/${loaded.lager.jahr}${status === "entwurf" ? "?vorschau=1" : ""}`;

  return (
    <div className="pb-4">
      <Link href="/admin/lager" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Alle Lager
      </Link>

      <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Lager bearbeiten</p>
          <h1 className="camp-display mt-2 text-3xl text-ink sm:text-5xl">{titel || `Lager ${jahr}`}</h1>
          <p className="mt-2 text-sm font-semibold text-muted">{statusText(status)}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Link href={previewHref} target="_blank" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-ink/10 bg-white px-4 text-sm font-bold text-ink hover:bg-sand">
            <Eye className="size-4" /> Vorschau
          </Link>
          <Button onClick={save} disabled={saving || !dirty} className="h-11">
            <Save className="size-4" /> {saving ? "Speichert…" : dirty ? "Speichern" : "Gespeichert"}
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
        <Section title="Veröffentlichung" description="Entwürfe sind nur im Cockpit sichtbar. Veröffentlicht erscheint das Lager auf der Website.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" htmlFor="lager-status">
              <select id="lager-status" value={status} onChange={(event) => change(setStatus, event.target.value as LagerPublikationsstatus)} className="flex h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
                <option value="entwurf">Entwurf – nicht öffentlich</option>
                <option value="veroeffentlicht">Veröffentlicht – aktuelles Lager</option>
                <option value="archiviert">Archiviert – früheres Lager</option>
              </select>
            </Field>
            <div className="rounded-xl bg-sand p-4 text-sm font-semibold leading-relaxed text-muted">
              {status === "entwurf"
                ? "Du kannst alle Inhalte vorbereiten und über «Vorschau» kontrollieren."
                : status === "veroeffentlicht"
                  ? "Dieses Lager wird aktuell angezeigt; das bisher veröffentlichte Lager wird automatisch archiviert."
                  : "Dieses Lager erscheint unter den früheren Lagerjahren."}
            </div>
          </div>
        </Section>

        <Section title="Dokumente" description="Hochladen, ersetzen und sortieren wird sofort gespeichert. «Link kopieren» liefert einen Link für Mails, der auch nach einer neuen Fassung gültig bleibt.">
          <EditableDokumentList lagerId={id} existing={loaded.dokumente} />
        </Section>

        <Section title="Grunddaten" description="Diese Angaben erscheinen auf der Lagerseite. Änderungen hier mit «Speichern» sichern.">
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <Field label="Jahr" htmlFor="lager-jahr">
              <Input id="lager-jahr" type="number" inputMode="numeric" value={jahr} onChange={(event) => change(setJahr, event.target.value)} />
            </Field>
            <Field label="Titel" htmlFor="lager-titel">
              <Input id="lager-titel" value={titel} onChange={(event) => change(setTitel, event.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Startdatum" htmlFor="lager-von">
              <Input id="lager-von" type="date" value={von} onChange={(event) => change(setVon, event.target.value)} />
            </Field>
            <Field label="Enddatum" htmlFor="lager-bis">
              <Input id="lager-bis" type="date" value={bis} onChange={(event) => change(setBis, event.target.value)} />
            </Field>
          </div>
          <Field label="Beschreibung">
            <MinimalEditor label="Beschreibung" value={beschreibung} onChange={(value) => change(setBeschreibung, value)} placeholder="Das Wichtigste zum Lager…" />
          </Field>
          <Field label="Anzahl Teilnehmende (optional)" htmlFor="lager-teilnehmer">
            <Input id="lager-teilnehmer" type="number" inputMode="numeric" min="0" className="max-w-xs" value={teilnehmer} onChange={(event) => change(setTeilnehmer, event.target.value)} />
          </Field>
          <Field label="Aktivitäten (eine pro Zeile)" htmlFor="lager-aktivitaeten">
            <textarea id="lager-aktivitaeten" value={aktivitaeten} onChange={(event) => change(setAktivitaeten, event.target.value)} rows={6} className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30" placeholder={'Skifahren\nSnowboarden\nSpieleabend'} />
          </Field>
        </Section>

        <Section title="Fotos und Video" description="Das Fotoalbum ist durch das Lagerpasswort geschützt. Video-Links sind öffentlich.">
          <Field label="Immich-Fotoalbum">
            <EditableImmich lagerId={id} albumId={loaded.fotoalbum?.id} current={loaded.fotoalbum?.url || ""} />
          </Field>
          <Field label="Video-Link (YouTube)" htmlFor="lager-video">
            <Input id="lager-video" type="url" inputMode="url" value={videoUrl} onChange={(event) => change(setVideoUrl, event.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
          </Field>
          <Field label="Link zur alten Lagerseite (optional)" htmlFor="lager-quelle">
            <Input id="lager-quelle" type="url" inputMode="url" value={quelleUrl} onChange={(event) => change(setQuelleUrl, event.target.value)} placeholder="https://…" />
          </Field>
        </Section>

        <section className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5 sm:p-8">
          <h2 className="font-display text-xl text-red-900">Lager löschen</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-red-800">
            Normalerweise genügt der Status «Archiviert». Löschen entfernt auch alle Dokumente und den Fotoalbum-Link dieses Lagers endgültig.
          </p>
          <Button type="button" variant="outline" onClick={remove} className="mt-5 border-red-300 text-red-700 hover:bg-red-100">
            <Trash2 className="size-4" /> Lager endgültig löschen
          </Button>
        </section>
      </div>

      {dirty ? (
        <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-ink/10 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Ungespeicherte Änderungen</p>
            <Button onClick={save} disabled={saving} className="h-11 shrink-0">
              <Save className="size-4" /> {saving ? "Speichert…" : "Speichern"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-8">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-muted">{description}</p>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function dateInput(value: string) {
  if (!value) return "";
  try {
    return isoToDateInput(value);
  } catch {
    return "";
  }
}

function statusText(status: LagerPublikationsstatus) {
  if (status === "entwurf") return "Entwurf – nur im Admin-Cockpit sichtbar";
  if (status === "archiviert") return "Archiviert – unter früheren Lagern sichtbar";
  return "Veröffentlicht – als aktuelles Lager sichtbar";
}
