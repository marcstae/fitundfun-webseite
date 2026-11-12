"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, FileText, Link2, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { documentHref } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dropzone } from "./dropzone";
import { SaveDialog, useSaveAction } from "./save-dialog";
import type { DokumentRecord } from "@/lib/pb-types";

const ICON_BUTTON =
  "inline-flex size-10 items-center justify-center rounded-md text-ink/60 hover:bg-ink/10 hover:text-ink disabled:opacity-25 sm:size-8";

export function EditableDokumentList({
  lagerId,
  existing,
}: {
  lagerId: string;
  existing: DokumentRecord[];
}) {
  const [items, setItems] = React.useState(existing);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DokumentRecord | null>(null);

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const previous = items;
    const swapped = [...items];
    [swapped[index], swapped[target]] = [swapped[target], swapped[index]];
    const next = swapped.map((document, sort) => ({ ...document, sort: sort + 1 }));
    setItems(next);
    try {
      await Promise.all(
        next.map((document) =>
          pbBrowser().collection(document.collection).update(document.id, { sort: document.sort })
        )
      );
      await revalidatePath(window.location.pathname);
      toast.success("Reihenfolge gespeichert");
    } catch {
      setItems(previous);
      toast.error("Reihenfolge konnte nicht gespeichert werden.");
    }
  };

  const copyLink = async (document: DokumentRecord) => {
    const url = new URL(documentHref(document), window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link kopiert – er bleibt auch nach einer neuen Fassung gültig.");
    } catch {
      // Ohne HTTPS gibt es keine Zwischenablage-API: Link zum manuellen Kopieren anzeigen.
      window.prompt("Link zum Kopieren:", url);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {items.length === 0 ? "Noch keine Dokumente." : `${items.length} Dokument${items.length === 1 ? "" : "e"}`}
        </p>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus /> Dokument hochladen
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((d, index) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-xl bg-ink/[0.03] px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 flex-1 basis-48 items-center gap-2">
                {d.sensibel ? (
                  <Lock className="size-4 shrink-0 text-muted" aria-hidden />
                ) : (
                  <FileText className="size-4 shrink-0 text-accent" aria-hidden />
                )}
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{d.name}</span>
                  <span className="block text-xs text-muted">
                    {d.sensibel ? "Geschützt (Lagerpasswort)" : "Öffentlich"}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => copyLink(d)}
                  className={ICON_BUTTON}
                  aria-label={`Link zu ${d.name} kopieren`}
                  title="Link kopieren"
                >
                  <Link2 className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className={ICON_BUTTON}
                  aria-label={`${d.name} nach oben verschieben`}
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  className={ICON_BUTTON}
                  aria-label={`${d.name} nach unten verschieben`}
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(d); setOpen(true); }}
                  className={ICON_BUTTON}
                  aria-label={`${d.name} bearbeiten oder neue Fassung hochladen`}
                >
                  <Pencil className="size-4" />
                </button>
                <DeleteDoc doc={d} onDeleted={() => setItems((current) => current.filter((item) => item.id !== d.id))} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <DokumentForm
          lagerId={lagerId}
          doc={editing}
          nextSort={Math.max(0, ...items.map((item) => item.sort || 0)) + 1}
          onSaved={(saved) => {
            setItems((current) => [
              ...current.filter((item) => item.id !== editing?.id),
              saved,
            ].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)));
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function DokumentForm({
  lagerId,
  doc,
  nextSort,
  onSaved,
  onClose,
}: {
  lagerId: string;
  doc: DokumentRecord | null;
  nextSort: number;
  onSaved: (document: DokumentRecord) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(doc?.name || "");
  // Neue Dokumente sind geschützt, bis bewusst «Für alle sichtbar» gewählt wird:
  // Teilnehmerlisten und Zimmerpläne enthalten Personendaten von Kindern.
  const [sensibel, setSensibel] = React.useState(doc?.sensibel ?? true);
  const [file, setFile] = React.useState<File | null>(null);
  const { saving, run } = useSaveAction();

  const collection = sensibel ? "dokumente_intern" : "dokumente";

  const save = async () => {
    if (!name.trim()) {
      toast.error("Bitte einen Namen eingeben.");
      return;
    }
    if (!doc && !file) {
      toast.error("Bitte eine PDF- oder Word-Datei wählen.");
      return;
    }
    let saved: DokumentRecord | null = null;
    const ok = await run(async () => {
      const pb = pbBrowser();
      const form = new FormData();
      form.set("name", name.trim());
      form.set("lager", lagerId);
      form.set("sensibel", sensibel ? "true" : "false");
      form.set("sort", String(doc?.sort ?? nextSort));
      if (file) form.set("datei", file);

      if (doc && doc.collection !== collection) {
        // Sichtbarkeit gewechselt: erst in der Zielsammlung anlegen, dann das Original löschen.
        if (!file) {
          const response = await fetch(documentHref(doc));
          if (!response.ok) throw new Error("Bestehende Datei konnte nicht geladen werden");
          const blob = await response.blob();
          form.set("datei", new File([blob], doc.datei, { type: blob.type }));
        }
        const created = await pb.collection(collection).create<DokumentRecord>(form);
        try {
          await pb.collection(doc.collection).delete(doc.id);
        } catch (error) {
          // Keine doppelte (und womöglich weiterhin öffentliche) Kopie zurücklassen.
          await pb.collection(collection).delete(created.id).catch(() => {});
          throw error;
        }
        saved = { ...created, collection };
      } else if (doc) {
        const updated = await pb.collection(collection).update<DokumentRecord>(doc.id, form);
        saved = { ...updated, collection };
      } else {
        const created = await pb.collection(collection).create<DokumentRecord>(form);
        saved = { ...created, collection };
      }
      await revalidatePath(window.location.pathname);
    });
    if (ok && saved) onSaved(saved);
  };

  return (
    <SaveDialog
      open
      onOpenChange={(o) => { if (!o) onClose(); }}
      title={doc ? "Dokument bearbeiten" : "Dokument hochladen"}
      description={
        doc
          ? "Neue Fassung hochladen oder Angaben ändern. Bereits verschickte Links bleiben gültig, solange die Sichtbarkeit gleich bleibt."
          : "PDF oder Word (.docx), höchstens 25 MB."
      }
      saving={saving}
      onSave={save}
    >
      <div className="space-y-2">
        <Label htmlFor="doc-name">Name</Label>
        <Input
          id="doc-name"
          value={name}
          placeholder="z. B. Anmeldeformular 2027"
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>{doc ? "Neue Fassung (optional)" : "Datei"}</Label>
        <Dropzone
          accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.docx"
          formats="PDF oder Word (.docx)"
          maxSizeMB={25}
          onFile={setFile}
          currentName={file ? file.name : doc?.datei}
          hint="PDF oder Word (.docx) hierher ziehen oder"
        />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink">Wer darf es sehen?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <VisibilityOption
            checked={sensibel}
            onChange={() => setSensibel(true)}
            title="Nur mit Lagerpasswort"
            text="Für Teilnehmerliste, Zimmerplan und alles mit Namen."
          />
          <VisibilityOption
            checked={!sensibel}
            onChange={() => setSensibel(false)}
            title="Für alle sichtbar"
            text="Für Anmeldeformular, Programm und allgemeine Infos."
          />
        </div>
      </fieldset>
    </SaveDialog>
  );
}

function VisibilityOption({
  checked,
  onChange,
  title,
  text,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  text: string;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
        checked ? "border-accent bg-accent/5" : "border-ink/15 hover:border-ink/30"
      }`}
    >
      <input
        type="radio"
        name="sichtbarkeit"
        checked={checked}
        onChange={onChange}
        className="mt-1 size-4 accent-[var(--color-accent)]"
      />
      <span>
        <span className="block text-sm font-bold text-ink">{title}</span>
        <span className="block text-xs text-muted">{text}</span>
      </span>
    </label>
  );
}

function DeleteDoc({ doc, onDeleted }: { doc: DokumentRecord; onDeleted: () => void }) {
  const [busy, setBusy] = React.useState(false);
  const del = async () => {
    if (!window.confirm(`Dokument «${doc.name}» wirklich löschen? Verschickte Links funktionieren danach nicht mehr.`)) return;
    setBusy(true);
    try {
      await pbBrowser().collection(doc.collection).delete(doc.id);
      await revalidatePath(window.location.pathname);
      toast.success("Gelöscht");
      onDeleted();
    } catch (e) {
      toast.error("Löschen fehlgeschlagen");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={del}
      disabled={busy}
      className="inline-flex size-10 items-center justify-center rounded-md text-red-600/80 hover:bg-red-50 hover:text-red-600 sm:size-8"
      aria-label={`${doc.name} löschen`}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
