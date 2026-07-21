"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEditMode } from "./edit-button";
import { isValidHttpUrl } from "@/lib/utils";
import type { ArchivRecord } from "@/lib/pb-types";

export function ArchivManager({ existing }: { existing: ArchivRecord[] }) {
  const { canEdit, editMode } = useEditMode();
  const [items, setItems] = React.useState(existing);
  const [open, setOpen] = React.useState(false);
  if (!canEdit || !editMode) return null;

  const del = async (it: ArchivRecord) => {
    if (!window.confirm(`Archiv-Eintrag ${it.jahr} löschen?`)) return;
    try {
      await pbBrowser().collection("archiv").delete(it.id);
      await revalidatePath("/lager");
      toast.success("Gelöscht");
      setItems((s) => s.filter((x) => x.id !== it.id));
    } catch (e) {
      toast.error("Löschen fehlgeschlagen");
      console.error(e);
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-accent/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Alt-Lager verwalten
        </span>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus /> Eintrag
        </Button>
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((it) => (
          <li
            key={it.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-ink/[0.03] px-3 py-2 text-sm"
          >
            <span className="font-semibold">{it.jahr}</span>
            <button
              onClick={() => del(it)}
              className="inline-flex size-7 items-center justify-center rounded-md text-red-600/70 hover:bg-red-50 hover:text-red-600"
              aria-label="Löschen"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      {open && (
        <ArchivForm
          onSaved={() => setOpen(false)}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function ArchivForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [jahr, setJahr] = React.useState("");
  const [video, setVideo] = React.useState("");
  const [fotos, setFotos] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    const j = Number(jahr);
    if (!j || j < 1990 || j > 2100) {
      toast.error("Bitte ein gültiges Jahr eingeben.");
      return;
    }
    if (video && !isValidHttpUrl(video)) {
      toast.error("Video-URL ist ungültig.");
      return;
    }
    if (fotos && !isValidHttpUrl(fotos)) {
      toast.error("Foto-URL ist ungültig.");
      return;
    }
    setSaving(true);
    try {
      await pbBrowser()
        .collection("archiv")
        .create({ jahr: j, video_url: video, fotos_url: fotos });
      await revalidatePath("/lager");
      toast.success("Gespeichert ✓");
      onSaved();
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
          <DialogTitle>Alt-Lager hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ar-jahr">Jahr</Label>
            <Input id="ar-jahr" type="number" value={jahr} onChange={(e) => setJahr(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ar-video">Video-URL (optional)</Label>
            <Input id="ar-video" value={video} onChange={(e) => setVideo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ar-fotos">Foto-URL (optional)</Label>
            <Input id="ar-fotos" value={fotos} onChange={(e) => setFotos(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Abbrechen</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Speichert…" : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
