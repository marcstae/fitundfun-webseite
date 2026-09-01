"use client";

import * as React from "react";
import { toast } from "sonner";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EditButton, useEditMode } from "./edit-button";
import { SaveDialog, useSaveAction } from "./save-dialog";
import { youtubeId, isValidHttpUrl } from "@/lib/utils";

interface Props {
  collection: "lager" | "archiv";
  recordId: string;
  current: string;
}

export function EditableYoutube({ collection, recordId, current }: Props) {
  const { canEdit, editMode } = useEditMode();
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState(current || "");
  const { saving, run } = useSaveAction();
  if (!canEdit || !editMode) return null;

  const id = youtubeId(url);
  const valid = !url || (isValidHttpUrl(url) && !!id);

  const save = async () => {
    if (!valid) {
      toast.error("Bitte eine gültige YouTube-URL eingeben.");
      return;
    }
    const ok = await run(async () => {
      await pbBrowser()
        .collection(collection)
        .update(recordId, {
          [collection === "lager" ? "youtube_url" : "video_url"]: url,
        });
      await revalidatePath(window.location.pathname);
    });
    if (ok) setOpen(false);
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
      <SaveDialog
        open={open}
        onOpenChange={setOpen}
        title="YouTube-Link"
        description="Akzeptiert alle YouTube-URL-Formen."
        saving={saving}
        onSave={save}
      >
        <div className="space-y-2">
          <Label htmlFor="yt-url">URL</Label>
          <Input
            id="yt-url"
            value={url}
            placeholder="https://www.youtube.com/watch?v=…"
            onChange={(e) => setUrl(e.target.value)}
          />
          {id && (
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
      </SaveDialog>
    </>
  );
}

export { EditButton };