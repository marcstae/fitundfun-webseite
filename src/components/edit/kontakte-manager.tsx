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
    const swapped = [...items];
    [swapped[index], swapped[target]] = [swapped[target], swapped[index]];
    const next = swapped.map((item, sort) => ({ ...item, sort: sort + 1 }));
    setItems(next);
    try {
      await Promise.all(next.map((item) => pbBrowser().collection("kontakte").update(item.id, { sort: item.sort })));
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
          <li key={it.id} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-lg bg-ink/[0.03] px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 basis-40">
              <span className="block truncate font-semibold">{it.name}</span>
              <span className="block truncate text-xs text-muted">
                {it.rolle === "Lagerleiter" ? "Lagerleitung" : it.rolle}
                {it.email ? ` · ${it.email}` : " · keine E-Mail"}
              </span>
            </span>
            <span className="flex shrink-0 gap-1">
              <button onClick={() => move(index, -1)} disabled={index === 0} className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-ink/60 hover:bg-ink/10 disabled:opacity-25" aria-label={`${it.name} nach oben verschieben`}><ArrowUp className="size-4" /></button>
              <button onClick={() => move(index, 1)} disabled={index === items.length - 1} className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-ink/60 hover:bg-ink/10 disabled:opacity-25" aria-label={`${it.name} nach unten verschieben`}><ArrowDown className="size-4" /></button>
              <button onClick={() => { setEditing(it); setOpen(true); }} className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-ink/60 hover:bg-ink/10 hover:text-ink" aria-label="Bearbeiten">
                <Pencil className="size-4" />
              </button>
              <button onClick={() => del(it)} className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-red-600/70 hover:bg-red-50 hover:text-red-600" aria-label="Löschen">
                <Trash2 className="size-4" />
              </button>
            </span>
          </li>
        ))}
      </ul>
      {open && (
        <KontaktForm
          item={editing}
          nextSort={Math.max(0, ...items.map((item) => item.sort || 0)) + 1}
          onSaved={() => { setOpen(false); window.location.reload(); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function KontaktForm({
  item,
  nextSort,
  onSaved,
  onClose,
}: {
  item: KontaktRecord | null;
  nextSort: number;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(item?.name || "");
  const [email, setEmail] = React.useState(item?.email || "");
  const [rolle, setRolle] = React.useState<KontaktRecord["rolle"]>(item?.rolle || "Lagerleiter");
  const { saving, run } = useSaveAction();

  const save = async () => {
    if (!name.trim()) {
      toast.error("Bitte einen Namen eingeben.");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Bitte eine gültige E-Mail-Adresse eingeben oder das Feld leer lassen.");
      return;
    }
    const ok = await run(async () => {
      const pb = pbBrowser();
      const data = { name: name.trim(), email: email.trim(), rolle };
      if (item) {
        await pb.collection("kontakte").update(item.id, data);
      } else {
        await pb.collection("kontakte").create({ ...data, sort: nextSort });
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
        <Label htmlFor="k-email">E-Mail (wird auf der Kontaktseite angezeigt)</Label>
        <Input
          id="k-email"
          type="email"
          inputMode="email"
          autoComplete="off"
          value={email}
          placeholder="optional"
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="k-rolle">Rolle</Label>
        <select
          id="k-rolle"
          value={rolle}
          onChange={(e) => setRolle(e.target.value as KontaktRecord["rolle"])}
          className="flex h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          <option value="Lagerleiter">Lagerleitung</option>
          <option value="Website">Website</option>
        </select>
      </div>
    </SaveDialog>
  );
}
