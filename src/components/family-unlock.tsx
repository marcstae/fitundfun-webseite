"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type UnlockState = { ok?: boolean; fehler?: "falsch" | "blockiert" };
export type UnlockAction = (state: UnlockState, formData: FormData) => Promise<UnlockState>;

/**
 * Geschützter Inhalt (Dokument oder Fotoalbum), öffnet im neuen Tab.
 * Gesperrt: Antippen fragt nach dem Familienpasswort. Danach setzt der Server das Cookie
 * und Next lädt die Seite neu; diese Komponente bleibt dabei bestehen (gleiche Position),
 * damit das Fenster einen echten Link «Dokument öffnen» anbieten kann. Ein Tab aus einem
 * Skript nach der Passwortprüfung würde von Handy-Browsern blockiert.
 */
export function FamilyUnlock({
  action,
  href,
  locked,
  autoOpen = false,
  className,
  children,
}: {
  action: UnlockAction;
  /** Ziel im neuen Tab; beim Fotoalbum erst nach dem Freischalten bekannt. */
  href: string | null;
  locked: boolean;
  autoOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(autoOpen && locked);
  const [state, formAction, pending] = React.useActionState(action, {});
  const router = useRouter();
  const inputId = React.useId();

  React.useEffect(() => {
    // Zurück aus dem Dokument (Back-Forward-Cache) zeigt sonst noch den gesperrten Stand.
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) router.refresh();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [router]);

  const link = (
    <a href={href || undefined} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );

  return (
    <>
      {locked ? (
        <button type="button" onClick={() => setOpen(true)} className={className}>
          {children}
        </button>
      ) : (
        link
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{state.ok ? "Freigeschaltet" : "Familienpasswort"}</DialogTitle>
            <DialogDescription className="mt-1">
              {state.ok
                ? "Der Zugang ist auf diesem Gerät gespeichert. Geschützte Inhalte öffnen sich ab jetzt direkt."
                : "Dieser Inhalt ist geschützt. Das Passwort erhaltet ihr von der Lagerleitung; danach bleibt der Zugang auf diesem Gerät gespeichert."}
            </DialogDescription>
          </DialogHeader>
          {state.ok ? (
            href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-accent px-6 text-base font-bold text-white transition hover:bg-ink"
              >
                Öffnen
              </a>
            ) : (
              <p className="text-sm text-muted">Wird geladen…</p>
            )
          ) : (
            <form action={formAction} className="space-y-3">
              <label htmlFor={inputId} className="sr-only">
                Familienpasswort
              </label>
              <input
                id={inputId}
                name="password"
                type="password"
                autoComplete="current-password"
                required
                aria-describedby={state.fehler ? `${inputId}-fehler` : undefined}
                placeholder="Familienpasswort"
                className="h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              {state.fehler ? (
                <p id={`${inputId}-fehler`} role="alert" className="text-sm font-semibold text-red-700">
                  {state.fehler === "blockiert"
                    ? "Zu viele Versuche – bitte in einer Stunde erneut versuchen."
                    : "Das Familienpasswort ist nicht korrekt."}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={pending}
                className="h-12 w-full rounded-xl bg-accent px-6 text-base font-bold text-white transition hover:bg-ink disabled:opacity-60"
              >
                {pending ? "Wird geprüft…" : "Freischalten"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
