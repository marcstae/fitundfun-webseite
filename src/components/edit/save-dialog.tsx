"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Gemeinsames Speichern-Gerüst: saving-State + Fehler-Toast. */
export function useSaveAction() {
  const [saving, setSaving] = React.useState(false);

  const run = React.useCallback(
    async (action: () => Promise<void>, errorMessage = "Speichern fehlgeschlagen") => {
      setSaving(true);
      try {
        await action();
        toast.success("Gespeichert ✓");
        return true;
      } catch (e) {
        toast.error(errorMessage);
        console.error(e);
        return false;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  return { saving, run };
}

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  className?: string;
  saveLabel?: string;
  saving: boolean;
  onSave: () => void;
  children: React.ReactNode;
}

/** Gemeinsames Dialog-Gerüst für alle Editor-Formulare. */
export function SaveDialog({
  open,
  onOpenChange,
  title,
  description,
  className,
  saveLabel,
  saving,
  onSave,
  children,
}: SaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <p className="text-sm text-muted">{description}</p> : null}
        </DialogHeader>
        <div className="space-y-4">{children}</div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Speichert…" : saveLabel || "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}