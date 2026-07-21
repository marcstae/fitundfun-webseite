"use client";

import * as React from "react";
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
import { EditButton, useEditMode } from "./edit-button";
import { isValidHttpUrl } from "@/lib/utils";

interface Props {
  lagerId: string;
  current: string;
}

export function EditableImmich({ lagerId, current }: Props) {
  const { canEdit, editMode } = useEditMode();
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState(current || "");
  const [saving, setSaving] = React.useState(false);
  if (!canEdit || !editMode) return null;

  const valid = !url || isValidHttpUrl(url);

  const save = async () => {
    if (!valid) {
      toast.error("Bitte eine gültige URL eingeben.");
      return;
    }
    setSaving(true);
    try {
      await pbBrowser().collection("lager").update(lagerId, { immich_url: url });
      await revalidatePath(window.location.pathname);
      await revalidatePath("/");
      toast.success("Gespeichert ✓");
      setOpen(false);
    } catch (e) {
      toast.error("Speichern fehlgeschlagen");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { setUrl(current || ""); setOpen(true); }}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-accent/30 px-3 text-xs font-bold text-accent hover:bg-accent/5"
      >
        Foto-Album-Link {current ? "ändern" : "setzen"}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Immich-Album-Link</DialogTitle>
            <DialogDescription>
              Share-Link mit Upload-Erlaubnis für Teilnehmende.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="im-url">URL</Label>
            <Input
              id="im-url"
              value={url}
              placeholder="https://…"
              onChange={(e) => setUrl(e.target.value)}
            />
            {url && !valid && (
              <p className="text-xs text-red-600">Ungültige URL.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Abbrechen
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Speichert…" : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { EditButton };
