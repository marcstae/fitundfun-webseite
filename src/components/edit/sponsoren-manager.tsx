"use client";

import * as React from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { Dropzone } from "./dropzone";
import { useEditMode } from "./edit-button";
import { isValidHttpUrl } from "@/lib/utils";
import type { SponsorRecord } from "@/lib/pb-types";

export function SponsorenManager({ existing }: { existing: SponsorRecord[] }) {
  const { canEdit, editMode } = useEditMode();
  const [items, setItems] = React.useState(existing);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SponsorRecord | null>(null);
  if (!canEdit || !editMode) return null;

  const del = async (it: SponsorRecord) => {
    if (!window.confirm(`Sponsor «${it.name}» löschen?`)) return;
    try {
      await pbBrowser().collection("sponsoren").delete(it.id);
      await revalidatePath("/sponsoren");
      await revalidatePath("/");
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
          Sponsoren verwalten
        </span>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus /> Hinzufügen
        </Button>
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-2 rounded-lg bg-ink/[0.03] px-3 py-2 text-sm">
            <span className="truncate font-semibold">{it.name}</span>
            <span className="flex gap-1">
              <button onClick={() => { setEditing(it); setOpen(true); }} className="inline-flex size-7 items-center justify-center rounded-md text-ink/60 hover:bg-ink/10 hover:text-ink" aria-label="Bearbeiten">
                <Pencil className="size-4" />
              </button>
              <button onClick={() => del(it)} className="inline-flex size-7 items-center justify-center rounded-md text-red-600/70 hover:bg-red-50 hover:text-red-600" aria-label="Löschen">
                <Trash2 className="size-4" />
              </button>
            </span>
          </li>
        ))}
      </ul>
      {open && (
        <SponsorForm
          item={editing}
          onSaved={() => { setOpen(false); window.location.reload(); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function SponsorForm({
  item,
  onSaved,
  onClose,
}: {
  item: SponsorRecord | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(item?.name || "");
  const [url, setUrl] = React.useState(item?.url || "");
  const [logo, setLogo] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!name.trim()) {
      toast.error("Bitte einen Namen eingeben.");
      return;
    }
    if (url && !isValidHttpUrl(url)) {
      toast.error("URL ist ungültig.");
      return;
    }
    setSaving(true);
    try {
      const pb = pbBrowser();
      const form = new FormData();
      form.set("name", name.trim());
      form.set("url", url);
      form.set("sort", String(item?.sort ?? 0));
      if (logo) form.set("logo", logo);
      if (item) {
        await pb.collection("sponsoren").update(item.id, form);
      } else {
        await pb.collection("sponsoren").create(form);
      }
      await revalidatePath("/sponsoren");
      await revalidatePath("/");
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
          <DialogTitle>{item ? "Sponsor bearbeiten" : "Sponsor hinzufügen"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sp-name">Name</Label>
            <Input id="sp-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-url">URL (optional)</Label>
            <Input id="sp-url" value={url} placeholder="https://…" onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Logo (optional)</Label>
            <Dropzone
              accept="image/*"
              maxSizeMB={5}
              onFile={setLogo}
              currentName={logo ? logo.name : item?.logo}
              label="Logo wählen"
              hint="PNG/SVG/JPG hierher ziehen oder"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Abbrechen</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Speichert…" : "Speichern"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
