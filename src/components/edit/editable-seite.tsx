"use client";

import * as React from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { MinimalEditor } from "./minimal-editor";
import { useEditMode } from "./edit-button";
import type { SeiteRecord } from "@/lib/pb-types";

interface Props {
  slug: string;
  seite: SeiteRecord | null;
  defaultTitel: string;
}

export function EditableSeite({ slug, seite, defaultTitel }: Props) {
  const { canEdit, editMode } = useEditMode();
  const [open, setOpen] = React.useState(false);
  const [titel, setTitel] = React.useState(seite?.titel || defaultTitel);
  const [inhalt, setInhalt] = React.useState(seite?.inhalt || "");
  const [saving, setSaving] = React.useState(false);
  if (!canEdit || !editMode) return null;

  const save = async () => {
    setSaving(true);
    try {
      const pb = pbBrowser();
      if (seite) {
        await pb.collection("seiten").update(seite.id, { titel, inhalt });
      } else {
        await pb.collection("seiten").create({ slug, titel, inhalt });
      }
      await revalidatePath(`/${slug}`);
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
      <Button variant="outline" onClick={() => setOpen(true)}>
        Seite bearbeiten
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Seite bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="se-titel">Titel</Label>
              <Input id="se-titel" value={titel} onChange={(e) => setTitel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Inhalt</Label>
              <MinimalEditor value={inhalt} onChange={setInhalt} placeholder="Text erfassen…" />
            </div>
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

export { Textarea };
