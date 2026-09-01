"use client";

import * as React from "react";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EditButton, useEditMode } from "./edit-button";
import { SaveDialog, useSaveAction } from "./save-dialog";

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
  const { editMode } = useEditMode();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const { saving, run } = useSaveAction();
  const openDialog = () => {
    setDraft(value);
    setOpen(true);
  };

  const save = async () => {
    const ok = await run(async () => {
      const pb = pbBrowser();
      const list = await pb.collection("einstellungen").getList(1, 1);
      const rec = list.items[0];
      if (!rec) {
        await pb.collection("einstellungen").create({ [field]: draft });
      } else {
        await pb.collection("einstellungen").update(rec.id, { [field]: draft });
      }
      await revalidatePath("/");
    });
    if (ok) setOpen(false);
  };

  return (
    <>
      <span className="group/edit relative inline">
        {children}
        {editMode && (
          <span className="ml-2 align-middle">
            <EditButton label={label} onClick={openDialog} />
          </span>
        )}
      </span>
      <SaveDialog
        open={open}
        onOpenChange={setOpen}
        title={`${label} bearbeiten`}
        description="Wird auf der Startseite im Hero angezeigt."
        saving={saving}
        onSave={save}
      >
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
      </SaveDialog>
    </>
  );
}