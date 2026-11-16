"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { pbBrowser } from "@/lib/pb";
import { revalidieren } from "@/lib/revalidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reihenfolgeAendern, SaveDialog, useSaveAction } from "./save-dialog";
import { isValidHttpUrl } from "@/lib/utils";
import type { LinkRecord } from "@/lib/pb-types";

export function EditableLinks() {
  const [items, setItems] = React.useState<LinkRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [ladefehler, setLadefehler] = React.useState(false);
  const [editing, setEditing] = React.useState<LinkRecord | null>(null);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const res = await pbBrowser()
        .collection("links")
        .getList<LinkRecord>(1, 500, { sort: "sort,titel" });
      setItems(res.items);
      setLadefehler(false);
    } catch {
      setLadefehler(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const move = (index: number, delta: -1 | 1) =>
    reihenfolgeAendern(items, setItems, index, delta, (item) =>
      pbBrowser().collection("links").update(item.id, { sort: item.sort })
    );

  const del = async (it: LinkRecord) => {
    if (!window.confirm(`Link «${it.titel}» löschen?`)) return;
    try {
      await pbBrowser().collection("links").delete(it.id);
      await revalidieren();
      toast.success("Gelöscht");
      load();
    } catch (e) {
      toast.error("Löschen fehlgeschlagen");
      console.error(e);
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-accent/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Nützliche Links
        </span>
        <Button
          size="sm"
          onClick={() => { setEditing(null); setOpen(true); }}
        >
          <Plus /> Hinzufügen
        </Button>
      </div>
      {ladefehler ? (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">
          Die Links konnten nicht geladen werden. Bitte die Seite neu laden.
        </p>
      ) : null}
      {!loading && items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {items.map((it, index) => (
            <li
              key={it.id}
              className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-lg bg-ink/[0.03] px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 basis-40 truncate font-semibold">{it.titel}</span>
              <span className="flex shrink-0 gap-1">
                <button onClick={() => move(index, -1)} disabled={index === 0} className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-ink/60 hover:bg-ink/10 disabled:opacity-25" aria-label={`${it.titel} nach oben verschieben`}><ArrowUp className="size-4" /></button>
                <button onClick={() => move(index, 1)} disabled={index === items.length - 1} className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-ink/60 hover:bg-ink/10 disabled:opacity-25" aria-label={`${it.titel} nach unten verschieben`}><ArrowDown className="size-4" /></button>
                <button
                  onClick={() => { setEditing(it); setOpen(true); }}
                  className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-ink/60 hover:bg-ink/10 hover:text-ink"
                  aria-label={`${it.titel} bearbeiten`}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => del(it)}
                  className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-red-600/70 hover:bg-red-50 hover:text-red-600"
                  aria-label={`${it.titel} löschen`}
                >
                  <Trash2 className="size-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <LinkForm
          item={editing}
          nextSort={Math.max(0, ...items.map((item) => item.sort || 0)) + 1}
          onSaved={() => { load(); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function LinkForm({
  item,
  nextSort,
  onSaved,
  onClose,
}: {
  item: LinkRecord | null;
  nextSort: number;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [titel, setTitel] = React.useState(item?.titel || "");
  const [url, setUrl] = React.useState(item?.url || "");
  const { saving, run } = useSaveAction();

  const save = async () => {
    if (!titel.trim() || !isValidHttpUrl(url)) {
      toast.error("Bitte Titel und gültige URL eingeben.");
      return;
    }
    const ok = await run(async () => {
      const pb = pbBrowser();
      if (item) {
        await pb.collection("links").update(item.id, { titel, url });
      } else {
        await pb.collection("links").create({ titel, url, sort: nextSort });
      }
      await revalidieren();
    });
    if (ok) onSaved();
  };

  return (
    <SaveDialog
      open
      onOpenChange={(o) => { if (!o) onClose(); }}
      title={item ? "Link bearbeiten" : "Link hinzufügen"}
      saving={saving}
      onSave={save}
    >
      <div className="space-y-2">
        <Label htmlFor="lnk-titel">Titel</Label>
        <Input
          id="lnk-titel"
          value={titel}
          placeholder="z. B. Bergbahnen Brigels"
          onChange={(e) => setTitel(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lnk-url">URL</Label>
        <Input
          id="lnk-url"
          value={url}
          placeholder="https://…"
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
    </SaveDialog>
  );
}
