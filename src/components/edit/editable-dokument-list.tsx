"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dropzone } from "./dropzone";
import { EditButton, useEditMode } from "./edit-button";
import type { DokumentRecord } from "@/lib/pb-types";

export function EditableDokumentList({
  lagerId,
  existing,
}: {
  lagerId: string;
  existing: DokumentRecord[];
}) {
  const { canEdit, editMode } = useEditMode();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DokumentRecord | null>(null);
  if (!canEdit || !editMode) return null;

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
      {existing.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {existing.map((d) => (
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
                  onClick={() => { setEditing(d); setOpen(true); }}
                  className="inline-flex size-7 items-center justify-center rounded-md text-ink/60 hover:bg-ink/10 hover:text-ink"
                  aria-label="Bearbeiten"
                >
                  <Pencil className="size-4" />
                </button>
                <DeleteDoc doc={d} lagerId={lagerId} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <DokumentForm
          lagerId={lagerId}
          doc={editing}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function DokumentForm({
  lagerId,
  doc,
  onClose,
}: {
  lagerId: string;
  doc: DokumentRecord | null;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(doc?.name || "");
  const [sensibel, setSensibel] = React.useState(doc?.sensibel ?? false);
  const [file, setFile] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);

  const collection = sensibel ? "dokumente_intern" : "dokumente";

  const save = async () => {
    if (!name.trim()) {
      toast.error("Bitte einen Namen eingeben.");
      return;
    }
    setSaving(true);
    try {
      const pb = pbBrowser();
      const form = new FormData();
      form.set("name", name.trim());
      form.set("lager", lagerId);
      form.set("sensibel", sensibel ? "true" : "false");
      form.set("sort", String(doc?.sort ?? 0));
      if (file) form.set("datei", file);

      // Sammlung kann sich beim Sensibel-Toggle ändern → ggf. verschieben
      if (doc) {
        const origColl = doc.collection;
        if (origColl === collection) {
          await pb.collection(collection).update(doc.id, form);
        } else {
          await pb.collection(origColl).delete(doc.id);
          await pb.collection(collection).create(form);
        }
      } else {
        if (!file) {
          toast.error("Bitte eine PDF-Datei wählen.");
          setSaving(false);
          return;
        }
        await pb.collection(collection).create(form);
      }
      await revalidatePath(window.location.pathname);
      toast.success("Gespeichert ✓");
      onClose();
    } catch (e) {
      toast.error("Speichern fehlgeschlagen");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{doc ? "Dokument bearbeiten" : "Dokument hochladen"}</DialogTitle>
          <DialogDescription>Nur PDF, max. 20 MB.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
            <Label>PDF-Datei</Label>
            <Dropzone
              accept="application/pdf"
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
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Speichert…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDoc({ doc, lagerId }: { doc: DokumentRecord; lagerId: string }) {
  const [busy, setBusy] = React.useState(false);
  const del = async () => {
    if (!window.confirm(`Dokument «${doc.name}» wirklich löschen?`)) return;
    setBusy(true);
    try {
      await pbBrowser().collection(doc.collection).delete(doc.id);
      await revalidatePath(window.location.pathname);
      toast.success("Gelöscht");
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

export { EditButton };
