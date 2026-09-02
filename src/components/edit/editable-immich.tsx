"use client";

import * as React from "react";
import { toast } from "sonner";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaveDialog, useSaveAction } from "./save-dialog";
import { isValidHttpUrl } from "@/lib/utils";

interface Props {
  lagerId: string;
  albumId?: string;
  current: string;
}

export function EditableImmich({
  lagerId,
  albumId,
  current,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [id, setId] = React.useState(albumId);
  const [savedUrl, setSavedUrl] = React.useState(current || "");
  const [url, setUrl] = React.useState(current || "");
  const { saving, run } = useSaveAction();
  const valid = !url || isValidHttpUrl(url);

  const save = async () => {
    if (!valid) {
      toast.error("Bitte eine gültige URL eingeben.");
      return;
    }
    const ok = await run(async () => {
      const albums = pbBrowser().collection("fotoalben");
      if (!url && id) {
        await albums.delete(id);
        setId(undefined);
      } else if (id) {
        await albums.update(id, { url });
      } else if (url) {
        const created = await albums.create({ lager: lagerId, url });
        setId(created.id);
      }
      await revalidatePath(window.location.pathname);
      await revalidatePath("/");
    });
    if (ok) {
      setSavedUrl(url);
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { setUrl(savedUrl); setOpen(true); }}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-accent/30 px-3 text-xs font-bold text-accent hover:bg-accent/5"
      >
        Foto-Album-Link {savedUrl ? "ändern" : "setzen"}
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
