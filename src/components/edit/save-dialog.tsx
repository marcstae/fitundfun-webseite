"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { ClientResponseError } from "pocketbase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Verständlicher Grund aus einer PocketBase-Validierung, sonst null. */
function fieldProblem(error: unknown): string | null {
  if (!(error instanceof ClientResponseError)) return null;
  const fields = Object.values((error.response?.data || {}) as Record<string, { code?: string }>);
  const codes = fields.map((field) => field?.code || "");
  if (codes.some((code) => code.includes("file_size"))) return "Datei zu gross – bitte eine kleinere Datei wählen.";
  if (codes.some((code) => code.includes("mime_type"))) return "Dieses Dateiformat ist hier nicht erlaubt.";
  if (codes.some((code) => code === "validation_not_unique")) return "Dieser Eintrag existiert bereits (z. B. das gleiche Lagerjahr).";
  if (error.status === 401 || error.status === 403) return "Die Anmeldung ist abgelaufen – bitte neu anmelden.";
  return null;
}

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
        toast.error(fieldProblem(e) || errorMessage);
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

/** Bei ungespeicherten Änderungen vor dem Verlassen der Seite nachfragen. */
export function useLeaveGuard(dirty: boolean) {
  React.useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    // Klicks auf Links und «Abmelden» abfangen: Next-Navigation löst kein beforeunload aus.
    // Capture-Phase auf document läuft vor den React-Handlern.
    // ponytail: Der Zurück-Knopf des Browsers (popstate) wird nicht abgefangen.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = (event.target as Element | null)?.closest('a[href]:not([target="_blank"]), [data-leave-guard]');
      if (target && !window.confirm("Ungespeicherte Änderungen verwerfen?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}

/** Klebende Leiste unten, sobald es ungespeicherte Änderungen gibt. */
export function DirtySaveBar({ dirty, saving, onSave }: { dirty: boolean; saving: boolean; onSave: () => void }) {
  if (!dirty) return null;
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-ink/10 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">Ungespeicherte Änderungen</p>
        <Button onClick={onSave} disabled={saving} className="h-11 shrink-0">
          <Save className="size-4" /> {saving ? "Speichert…" : "Speichern"}
        </Button>
      </div>
    </div>
  );
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
          {description ? <DialogDescription className="mt-1">{description}</DialogDescription> : null}
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