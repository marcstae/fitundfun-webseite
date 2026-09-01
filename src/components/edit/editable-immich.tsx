"use client";

import * as React from "react";
import { toast } from "sonner";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EditButton, useEditMode } from "./edit-button";
import { SaveDialog, useSaveAction } from "./save-dialog";
import { isValidHttpUrl } from "@/lib/utils";

interface Props {
  relation: "lager" | "archiv";
  relationId: string;
  albumId?: string;
  current: string;
}

export function EditableImmich({
  relation,
  relationId,
  albumId,
  current,
}: Props) {
  const { canEdit, editMode } = useEditMode();
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState(current || "");
  const { saving, run } = useSaveAction();
  if (!canEdit || !editMode) return null;

  const valid = !url || isValidHttpUrl(url);

  const save = async () => {
    if (!valid) {
      toast.error("Bitte eine gültige URL eingeben.");
      return;
    }
    const ok = await run(async () => {
      const albums = pbBrowser().collection("fotoalben");
      if (!url && albumId) {
        await albums.delete(albumId);
      } else if (albumId) {
        await albums.update(albumId, { url });
      } else if (url) {
        await albums.create({ [relation]: relationId, url });
      }
      await revalidatePath(window.location.pathname);
      await revalidatePath("/");
    });
    if (ok) setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => { setUrl(current || ""); setOpen(true); }}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-accent/30 px-3 text-xs font-bold text-accent hover:bg-accent/5"
      >
        Foto-Album-Link {current ? "ändern" : "setzen"}
      </button>
      <SaveDialog
        open={open}
        onOpenChange={setOpen}
        title="Immich-Album-Link"
        description="Share-Link mit Upload-Erlaubnis für Teilnehmende."
        saving={saving}
        onSave={save}
      >
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
      </SaveDialog>
    </>
  );
}

export { EditButton };