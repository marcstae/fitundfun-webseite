"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus, Pencil, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dropzone } from "./dropzone";
import { SaveDialog, useSaveAction } from "./save-dialog";
import type { DokumentRecord } from "@/lib/pb-types";

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
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setItems(next);
    try {
      await Promise.all(
        next.map((document, sort) =>
          pbBrowser().collection(document.collection).update(document.id, { sort: sort + 1 })
        )
      );
      await revalidatePath(window.location.pathname);
      toast.success("Reihenfolge gespeichert");
    } catch {
      setItems(items);
      toast.error("Reihenfolge konnte nicht gespeichert werden.");
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-accent/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Dokumente verwalten
        </span>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus /> Hinzufügen
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {items.map((d, index) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-ink/[0.03] px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 truncate">
                <FileText className="size-4 text-accent" />
                <span className="truncate font-semibold">{d.name}</span>
                {d.sensibel && (
                  <span className="text-xs text-muted">🔒 sensibel</span>
                )}
              </span>
              <span className="flex shrink-0 gap-1">
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="inline-flex size-7 items-center justify-center rounded-md text-ink/60 hover:bg-ink/10 hover:text-ink disabled:opacity-25"
                  aria-label={`${d.name} nach oben verschieben`}
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  className="inline-flex size-7 items-center justify-center rounded-md text-ink/60 hover:bg-ink/10 hover:text-ink disabled:opacity-25"
                  aria-label={`${d.name} nach unten verschieben`}
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  onClick={() => { setEditing(d); setOpen(true); }}
                  className="inline-flex size-7 items-center justify-center rounded-md text-ink/60 hover:bg-ink/10 hover:text-ink"
                  aria-label="Bearbeiten"
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
  onSaved,
  onClose,
}: {
  lagerId: string;
  doc: DokumentRecord | null;
  onSaved: (document: DokumentRecord) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(doc?.name || "");
  const [sensibel, setSensibel] = React.useState(doc?.sensibel ?? false);
  const [file, setFile] = React.useState<File | null>(null);
  const { saving, run } = useSaveAction();

  const collection = sensibel ? "dokumente_intern" : "dokumente";

  const save = async () => {
    if (!name.trim()) {
      toast.error("Bitte einen Namen eingeben.");
      return;
    }
    if (!doc && !file) {
      toast.error("Bitte eine PDF- oder DOCX-Datei wählen.");
      return;
    }
    let saved: DokumentRecord | null = null;
    const ok = await run(async () => {
      const pb = pbBrowser();
      const form = new FormData();
      form.set("name", name.trim());
      form.set("lager", lagerId);
      form.set("sensibel", sensibel ? "true" : "false");
      form.set("sort", String(doc?.sort ?? 0));
      if (file) form.set("datei", file);

      // Sammlung kann sich beim Sensibel-Toggle ändern → verschieben:
      // erst in die Ziel-Sammlung anlegen, erst danach das Original löschen
      // (kein Datenverlustfenster, anders als Delete-then-Create).
      if (doc && doc.collection !== collection) {
        if (!file) {
          const response = await fetch(
            `/api/download/${doc.collection}/${doc.id}/${encodeURIComponent(doc.datei)}`
          );
          if (!response.ok) throw new Error("Bestehende Datei konnte nicht geladen werden");
          const blob = await response.blob();
          form.set("datei", new File([blob], doc.datei, { type: blob.type }));
        }
        const created = await pb.collection(collection).create<DokumentRecord>(form);
        saved = { ...created, collection };
        await pb.collection(doc.collection).delete(doc.id);
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
      description="PDF oder DOCX, max. 20 MB."
      saving={saving}
      onSave={save}
    >
      <div className="space-y-2">
        <Label htmlFor="doc-name">Name</Label>
        <Input
          id="doc-name"
          value={name}
          placeholder="z. B. Packliste"
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Dokument</Label>
        <Dropzone
          accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          maxSizeMB={20}
          onFile={setFile}
          currentName={file ? file.name : doc?.datei}
        />
      </div>
      <label className="flex items-center justify-between rounded-xl border border-ink/10 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          🔒 Sensibel
          <span className="text-xs font-normal text-muted">
            nur für eingeloggte Familie
          </span>
        </span>
        <Switch checked={sensibel} onCheckedChange={setSensibel} />
      </label>
    </SaveDialog>
  );
}


function DeleteDoc({ doc, onDeleted }: { doc: DokumentRecord; onDeleted: () => void }) {
  const [busy, setBusy] = React.useState(false);
  const del = async () => {
    if (!window.confirm(`Dokument «${doc.name}» wirklich löschen?`)) return;
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
      onClick={del}
      disabled={busy}
      className="inline-flex size-7 items-center justify-center rounded-md text-red-600/70 hover:bg-red-50 hover:text-red-600"
      aria-label="Löschen"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
