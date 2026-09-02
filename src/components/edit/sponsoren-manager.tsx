"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dropzone } from "./dropzone";
import { SaveDialog, useSaveAction } from "./save-dialog";
import { isValidHttpUrl } from "@/lib/utils";
import type { SponsorRecord } from "@/lib/pb-types";

export function SponsorenManager({ existing }: { existing: SponsorRecord[] }) {
  const [items, setItems] = React.useState(existing);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SponsorRecord | null>(null);

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const previous = items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try {
      await Promise.all(next.map((item, sort) => pbBrowser().collection("sponsoren").update(item.id, { sort: sort + 1 })));
      await revalidatePath("/sponsoren");
      await revalidatePath("/");
      toast.success("Reihenfolge gespeichert");
    } catch {
      setItems(previous);
      toast.error("Reihenfolge konnte nicht gespeichert werden.");
    }
  };
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
        {items.map((it, index) => (
          <li key={it.id} className="flex items-center justify-between gap-2 rounded-lg bg-ink/[0.03] px-3 py-2 text-sm">
            <span className="truncate font-semibold">{it.name}</span>
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
  const [removeLogo, setRemoveLogo] = React.useState(false);
  const { saving, run } = useSaveAction();

  const save = async () => {
    if (!name.trim()) {
      toast.error("Bitte einen Namen eingeben.");
      return;
    }
    if (url && !isValidHttpUrl(url)) {
      toast.error("URL ist ungültig.");
      return;
    }
    const ok = await run(async () => {
      const pb = pbBrowser();
      const form = new FormData();
      form.set("name", name.trim());
      form.set("url", url);
      form.set("sort", String(item?.sort ?? 0));
      if (logo) form.set("logo", logo);
      if (removeLogo && item?.logo) form.append("logo-", item.logo);
      if (item) {
        await pb.collection("sponsoren").update(item.id, form);
      } else {
        await pb.collection("sponsoren").create(form);
      }
      await revalidatePath("/sponsoren");
      await revalidatePath("/");
    });
    if (ok) onSaved();
  };

  return (
    <SaveDialog
      open
      onOpenChange={(o) => { if (!o) onClose(); }}
      title={item ? "Sponsor bearbeiten" : "Sponsor hinzufügen"}
      saving={saving}
      onSave={save}
    >
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
          onFile={(file) => { setLogo(file); setRemoveLogo(false); }}
          currentName={removeLogo ? null : logo?.name || item?.logo}
          label="Logo wählen"
          hint="PNG/SVG/JPG hierher ziehen oder"
        />
        {item?.logo && !removeLogo ? (
          <button
            type="button"
            onClick={() => { setLogo(null); setRemoveLogo(true); }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:underline"
          >
            <Trash2 className="size-3.5" /> Bestehendes Logo entfernen
          </button>
        ) : null}
      </div>
    </SaveDialog>
  );
}
