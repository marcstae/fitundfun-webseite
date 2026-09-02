"use client";

import * as React from "react";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MinimalEditor } from "./minimal-editor";
import { SaveDialog, useSaveAction } from "./save-dialog";
import type { SeiteRecord } from "@/lib/pb-types";

interface Props {
  slug: string;
  seite: SeiteRecord | null;
  defaultTitel: string;
}

export function EditableSeite({ slug, seite, defaultTitel }: Props) {
  const [recordId, setRecordId] = React.useState(seite?.id);
  const [open, setOpen] = React.useState(false);
  const [titel, setTitel] = React.useState(seite?.titel || defaultTitel);
  const [inhalt, setInhalt] = React.useState(seite?.inhalt || "");
  const { saving, run } = useSaveAction();
  const save = async () => {
    const ok = await run(async () => {
      const pb = pbBrowser();
      if (recordId) {
        await pb.collection("seiten").update(recordId, { titel, inhalt });
      } else {
        const created = await pb.collection("seiten").create({ slug, titel, inhalt });
        setRecordId(created.id);
      }
      await revalidatePath(`/${slug}`);
    });
    if (ok) setOpen(false);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {recordId ? "Seite bearbeiten" : "Inhalt erfassen"}
      </Button>
      <SaveDialog
        open={open}
        onOpenChange={setOpen}
        title="Seite bearbeiten"
        saving={saving}
        onSave={save}
      >
        <div className="space-y-2">
          <Label htmlFor="se-titel">Titel</Label>
          <Input id="se-titel" value={titel} onChange={(e) => setTitel(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Inhalt</Label>
          <MinimalEditor value={inhalt} onChange={setInhalt} placeholder="Text erfassen…" />
        </div>
      </SaveDialog>
    </>
  );
}
