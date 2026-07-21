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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EditButton } from "./edit-button";

interface EditableHeroProps {
  field: "hero_titel" | "hero_willkommen";
  label: string;
  value: string;
  multiline?: boolean;
  children: React.ReactNode;
}

/** Inline-editierbarer Hero-Text (Titel / Willkommenssatz). */
export function EditableHero({
  field,
  label,
  value,
  multiline,
  children,
}: EditableHeroProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const [saving, setSaving] = React.useState(false);

  const openDialog = () => {
    setDraft(value);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const pb = pbBrowser();
      const list = await pb.collection("einstellungen").getList(1, 1);
      const rec = list.items[0];
      if (!rec) {
        await pb.collection("einstellungen").create({ [field]: draft });
      } else {
        await pb.collection("einstellungen").update(rec.id, { [field]: draft });
      }
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
      <span className="group/edit relative inline">
        {children}
        <span className="ml-2 align-middle">
          <EditButton label={label} onClick={openDialog} />
        </span>
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{label} bearbeiten</DialogTitle>
            <DialogDescription>
              Wird auf der Startseite im Hero angezeigt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="hero-field">{label}</Label>
            {multiline ? (
              <Textarea
                id="hero-field"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
              />
            ) : (
              <Input
                id="hero-field"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
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
