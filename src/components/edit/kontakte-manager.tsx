"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaveDialog, useSaveAction } from "./save-dialog";
import type { KontaktRecord } from "@/lib/pb-types";

export function KontakteManager({ existing }: { existing: KontaktRecord[] }) {
  const [items, setItems] = React.useState(existing);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<KontaktRecord | null>(null);

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const previous = items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try {
      await Promise.all(next.map((item, sort) => pbBrowser().collection("kontakte").update(item.id, { sort: sort + 1 })));
      await revalidatePath("/kontakt");
      toast.success("Reihenfolge gespeichert");
    } catch {
      setItems(previous);
      toast.error("Reihenfolge konnte nicht gespeichert werden.");
    }
  };
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
        {items.map((it, index) => (
          <li key={it.id} className="flex items-center justify-between gap-2 rounded-lg bg-ink/[0.03] px-3 py-2 text-sm">
            <span>
              <span className="font-semibold">{it.name}</span>
              <span className="ml-2 text-xs text-muted">{it.rolle}</span>
            </span>
            <span className="flex gap-1">
              <button onClick={() => move(index, -1)} disabled={index === 0} className="inline-flex size-7 items-center justify-center rounded-md text-ink/60 hover:bg-ink/10 disabled:opacity-25" aria-label={`${it.name} nach oben verschieben`}><ArrowUp className="size-4" /></button>
              <button onClick={() => move(index, 1)} disabled={index === items.length - 1} className="inline-flex size-7 items-center justify-center rounded-md text-ink/60 hover:bg-ink/10 disabled:opacity-25" aria-label={`${it.name} nach unten verschieben`}><ArrowDown className="size-4" /></button>
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
  const { saving, run } = useSaveAction();

  const save = async () => {
    if (!name.trim()) {
      toast.error("Bitte einen Namen eingeben.");
      return;
    }
    const ok = await run(async () => {
      const pb = pbBrowser();
      if (item) {
        await pb.collection("kontakte").update(item.id, { name, rolle });
      } else {
        await pb.collection("kontakte").create({ name, rolle, sort: 0 });
      }
      await revalidatePath("/kontakt");
    });
    if (ok) onSaved();
  };

  return (
    <SaveDialog
      open
      onOpenChange={(o) => { if (!o) onClose(); }}
      title={item ? "Kontakt bearbeiten" : "Kontakt hinzufügen"}
      saving={saving}
      onSave={save}
    >
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
    </SaveDialog>
  );
}
