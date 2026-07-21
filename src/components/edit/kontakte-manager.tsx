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
import { useEditMode } from "./edit-button";
import type { KontaktRecord } from "@/lib/pb-types";

export function KontakteManager({ existing }: { existing: KontaktRecord[] }) {
  const { canEdit, editMode } = useEditMode();
  const [items, setItems] = React.useState(existing);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<KontaktRecord | null>(null);
  if (!canEdit || !editMode) return null;

  const del = async (it: KontaktRecord) => {
    if (!window.confirm(`«${it.name}» löschen?`)) return;
    try {
      await pbBrowser().collection("kontakte").delete(it.id);
      await revalidatePath("/kontakt");
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
          Kontakte verwalten
        </span>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus /> Hinzufügen
        </Button>
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-2 rounded-lg bg-ink/[0.03] px-3 py-2 text-sm">
            <span>
              <span className="font-semibold">{it.name}</span>
              <span className="ml-2 text-xs text-muted">{it.rolle}</span>
            </span>
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
        <KontaktForm
          item={editing}
          onSaved={() => { setOpen(false); window.location.reload(); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function KontaktForm({
  item,
  onSaved,
  onClose,
}: {
  item: KontaktRecord | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(item?.name || "");
  const [rolle, setRolle] = React.useState<KontaktRecord["rolle"]>(item?.rolle || "Lagerleiter");
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!name.trim()) {
      toast.error("Bitte einen Namen eingeben.");
      return;
    }
    setSaving(true);
    try {
      const pb = pbBrowser();
      if (item) {
        await pb.collection("kontakte").update(item.id, { name, rolle });
      } else {
        await pb.collection("kontakte").create({ name, rolle, sort: 0 });
      }
      await revalidatePath("/kontakt");
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
          <DialogTitle>{item ? "Kontakt bearbeiten" : "Kontakt hinzufügen"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="k-name">Name</Label>
            <Input id="k-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="k-rolle">Rolle</Label>
            <select
              id="k-rolle"
              value={rolle}
              onChange={(e) => setRolle(e.target.value as KontaktRecord["rolle"])}
              className="flex h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              <option value="Lagerleiter">Lagerleiter</option>
              <option value="Website">Website</option>
            </select>
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
