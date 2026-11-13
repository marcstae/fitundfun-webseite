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
import { formularOffen, VERWERFEN } from "@/lib/leave-guard";

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

/** Fehler mit einer Meldung für die Lagerleitung; hat Vorrang vor der allgemeinen Fehlermeldung. */
export class Hinweis extends Error {}

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
        // Konkreter Grund (z. B. Anmeldung abgelaufen) zuerst, auch wenn er in einem Hinweis steckt.
        toast.error(fieldProblem(e instanceof Hinweis ? e.cause : e) || (e instanceof Hinweis ? e.message : errorMessage));
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

/** Bei ungespeicherten Änderungen vor dem Verlassen der Seite nachfragen (Link, Neuladen, Zurück). */
export function useLeaveGuard(dirty: boolean) {
  React.useEffect(() => (dirty ? formularOffen() : undefined), [dirty]);
}

/** Zustand eines Formulars mit «ungespeichert»-Erkennung über einen Schnappschuss. */
export function useFormular<T>(start: T, sonstGeaendert = false) {
  const [wert, setWert] = React.useState(start);
  const [gespeichert, setGespeichert] = React.useState(() => JSON.stringify(start));
  const dirty = JSON.stringify(wert) !== gespeichert || sonstGeaendert;
  useLeaveGuard(dirty);
  return { wert, setWert, dirty, alsGespeichert: (neu: T) => setGespeichert(JSON.stringify(neu)) };
}

/**
 * Leiste, sobald es ungespeicherte Änderungen gibt: auf dem Handy am unteren Rand,
 * am Desktop schwebend mit Abstand. Nachtblau mit Knopf in der Akzentfarbe für dunkle Flächen,
 * damit sie sich von den weissen Karten abhebt.
 */
export function DirtySaveBar({
  dirty,
  saving,
  onSave,
  label = "Ungespeicherte Änderungen",
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  label?: string;
}) {
  if (!dirty) return null;
  return (
    <div
      role="status"
      className="sticky bottom-0 z-20 -mx-4 mt-6 bg-navy-900 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-white shadow-[0_-8px_24px_rgba(14,28,48,0.18)] sm:bottom-6 sm:mx-auto sm:w-fit sm:min-w-[26rem] sm:rounded-full sm:py-2 sm:pl-6 sm:pr-2 sm:shadow-[0_18px_45px_rgba(14,28,48,0.35)]"
    >
      <div className="flex items-center justify-between gap-3 sm:gap-6">
        <p className="flex items-center gap-2.5 text-sm font-semibold">
          <span aria-hidden className="size-2 shrink-0 rounded-full bg-accent-light shadow-[0_0_0_4px_rgb(255_255_255/0.12)]" />
          {label}
        </p>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-accent-light px-4 text-sm sm:px-5 font-bold text-ink transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 disabled:opacity-60"
        >
          <Save className="size-4" /> {saving ? "Speichert…" : "Speichern"}
        </button>
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
  // Wurde etwas eingetippt, fragt Schliessen (Abbrechen, Escape, Klick daneben) nach.
  // Nach erfolgreichem Speichern schliessen die Editoren direkt über ihr eigenes setOpen.
  const [beruehrt, setBeruehrt] = React.useState(false);
  React.useEffect(() => {
    if (open) setBeruehrt(false);
  }, [open]);
  const schliessen = (next: boolean) => {
    if (!next && beruehrt && !saving && !window.confirm(VERWERFEN)) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={schliessen}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription className="mt-1">{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="space-y-4" onInput={() => setBeruehrt(true)}>{children}</div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => schliessen(false)} disabled={saving}>
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