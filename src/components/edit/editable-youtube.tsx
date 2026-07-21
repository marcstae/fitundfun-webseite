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
import { youtubeId, isValidHttpUrl } from "@/lib/utils";

interface Props {
  lagerId: string;
  current: string;
}

export function EditableYoutube({ lagerId, current }: Props) {
  const { canEdit, editMode } = useEditMode();
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState(current || "");
  const [saving, setSaving] = React.useState(false);
  if (!canEdit || !editMode) return null;

  const id = youtubeId(url);
  const valid = !url || (isValidHttpUrl(url) && !!id);

  const save = async () => {
    if (!valid) {
      toast.error("Bitte eine gültige YouTube-URL eingeben.");
      return;
    }
    setSaving(true);
    try {
      await pbBrowser().collection("lager").update(lagerId, { youtube_url: url });
      await revalidatePath(window.location.pathname);
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
      <div className="inline-flex items-center gap-2">
        <button
          onClick={() => { setUrl(current || ""); setOpen(true); }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-accent/30 px-3 text-xs font-bold text-accent hover:bg-accent/5"
        >
          Video-Link {current ? "ändern" : "setzen"}
        </button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>YouTube-Link</DialogTitle>
            <DialogDescription>
              Akzeptiert alle YouTube-URL-Formen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="yt-url">URL</Label>
            <Input
              id="yt-url"
              value={url}
              placeholder="https://www.youtube.com/watch?v=…"
              onChange={(e) => setUrl(e.target.value)}
            />
            {id && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                alt="Vorschau"
                className="mt-2 w-full rounded-lg border border-ink/10"
              />
            )}
            {url && !valid && (
              <p className="text-xs text-red-600">Ungültige YouTube-URL.</p>
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
