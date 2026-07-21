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
import { EditButton, useEditMode } from "./edit-button";
import { isValidHttpUrl } from "@/lib/utils";
import type { LinkRecord } from "@/lib/pb-types";

export function EditableLinks() {
  const { canEdit, editMode } = useEditMode();
  if (!canEdit || !editMode) return null;
  return (
    <div>
      <LinkManager />
    </div>
  );
}

function LinkManager() {
  const [items, setItems] = React.useState<LinkRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<LinkRecord | null>(null);
  const [open, setOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const res = await pbBrowser()
        .collection("links")
        .getList<LinkRecord>(1, 500, { sort: "sort,titel" });
      setItems(res.items);
    } catch {
      // collection existiert evtl. noch nicht
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const del = async (it: LinkRecord) => {
    if (!window.confirm(`Link «${it.titel}» löschen?`)) return;
    try {
      await pbBrowser().collection("links").delete(it.id);
      await revalidatePath(window.location.pathname);
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
      {!loading && items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-ink/[0.03] px-3 py-2 text-sm"
            >
              <span className="truncate font-semibold">{it.titel}</span>
              <span className="flex shrink-0 gap-1">
                <button
                  onClick={() => { setEditing(it); setOpen(true); }}
                  className="inline-flex size-7 items-center justify-center rounded-md text-ink/60 hover:bg-ink/10 hover:text-ink"
                  aria-label="Bearbeiten"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => del(it)}
                  className="inline-flex size-7 items-center justify-center rounded-md text-red-600/70 hover:bg-red-50 hover:text-red-600"
                  aria-label="Löschen"
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
          onSaved={() => { load(); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function LinkForm({
  item,
  onSaved,
  onClose,
}: {
  item: LinkRecord | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [titel, setTitel] = React.useState(item?.titel || "");
  const [url, setUrl] = React.useState(item?.url || "");
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!titel.trim() || !isValidHttpUrl(url)) {
      toast.error("Bitte Titel und gültige URL eingeben.");
      return;
    }
    setSaving(true);
    try {
      const pb = pbBrowser();
      if (item) {
        await pb.collection("links").update(item.id, { titel, url });
      } else {
        await pb.collection("links").create({ titel, url, sort: 0 });
      }
      await revalidatePath(window.location.pathname);
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
          <DialogTitle>{item ? "Link bearbeiten" : "Link hinzufügen"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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

export { EditButton };
