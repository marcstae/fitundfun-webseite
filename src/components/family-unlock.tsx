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
 * Gesperrt: Antippen fragt nach dem Lagerpasswort; ist es richtig, öffnet sich das Ziel
 * sofort. Der neue Tab wird schon beim Absenden geöffnet (sonst blockieren Handy-Browser
 * ihn nach der Prüfung) und erst danach zum Ziel geleitet; bei falschem Passwort schliesst
 * er sich wieder. Diese Komponente bleibt beim Neuladen nach dem Freischalten bestehen.
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
  const tabRef = React.useRef<Window | null>(null);
  const geoeffnet = React.useRef(false);

  const tabVorbereiten = () => {
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    tabRef.current = tab;
  };

  React.useEffect(() => {
    if (state.fehler) {
      tabRef.current?.close();
      tabRef.current = null;
      return;
    }
    // Beim Fotoalbum kommt href erst mit dem Neuladen nach dem Freischalten.
    if (!state.ok || !href || geoeffnet.current) return;
    geoeffnet.current = true;
    if (tabRef.current) tabRef.current.location.href = href;
    else window.location.href = href; // Tab blockiert: im gleichen Fenster öffnen
    tabRef.current = null;
    setOpen(false);
  }, [state, href]);

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
            <DialogTitle>Lagerpasswort</DialogTitle>
            <DialogDescription className="mt-1">
              {state.ok
                ? "Der Zugang ist auf diesem Gerät gespeichert. Geschützte Inhalte öffnen sich ab jetzt direkt."
                : "Dieser Inhalt ist geschützt. Das Passwort erhaltet ihr von der Lagerleitung; danach bleibt der Zugang auf diesem Gerät gespeichert."}
            </DialogDescription>
          </DialogHeader>
          {state.ok ? (
            <p className="text-sm text-muted">Wird geöffnet…</p>
          ) : (
            <form action={formAction} onSubmit={tabVorbereiten} className="space-y-3">
              <label htmlFor={inputId} className="sr-only">
                Lagerpasswort
              </label>
              <input
                id={inputId}
                name="password"
                type="password"
                autoComplete="current-password"
                required
                aria-describedby={state.fehler ? `${inputId}-fehler` : undefined}
                placeholder="Lagerpasswort"
                className="h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              {state.fehler ? (
                <p id={`${inputId}-fehler`} role="alert" className="text-sm font-semibold text-red-700">
                  {state.fehler === "blockiert"
                    ? "Zu viele Versuche – bitte in einer Stunde erneut versuchen."
                    : "Das Lagerpasswort ist nicht korrekt."}
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
