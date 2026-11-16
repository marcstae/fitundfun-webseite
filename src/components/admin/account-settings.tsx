"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { lagerpasswortAendern } from "@/app/admin/konto/actions";
import { useAuth } from "@/components/providers";
import { useLeaveGuard } from "@/components/edit/save-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pbBrowser } from "@/lib/pb";
import type { LagerpasswortRecord } from "@/lib/pb-types";

export function AccountSettings() {
  const { logout } = useAuth();
  const router = useRouter();
  const [lagerpasswort, setLagerpasswort] = React.useState("");
  const [lagerpasswortBestaetigung, setLagerpasswortBestaetigung] = React.useState("");
  const [speichertLagerpasswort, setSpeichertLagerpasswort] = React.useState(false);
  const [lagerpasswortGesetzt, setLagerpasswortGesetzt] = React.useState<boolean | null>(null);
  const [aktuellesLagerpasswort, setAktuellesLagerpasswort] = React.useState("");
  // Halb ausgefüllte Passwortfelder nicht still verlieren.
  useLeaveGuard(!!(lagerpasswort || lagerpasswortBestaetigung));

  React.useEffect(() => {
    pbBrowser()
      .collection("lagerpasswort")
      .getList<LagerpasswortRecord>(1, 1)
      .then((result) => {
        setLagerpasswortGesetzt(!!result.items[0]?.password_hash);
        setAktuellesLagerpasswort(result.items[0]?.passwort || "");
      })
      .catch(() => setLagerpasswortGesetzt(null));
  }, []);

  const lagerpasswortSpeichern = async (event: React.FormEvent) => {
    event.preventDefault();
    setSpeichertLagerpasswort(true);
    let result: Awaited<ReturnType<typeof lagerpasswortAendern>>;
    try {
      result = await lagerpasswortAendern(lagerpasswort, lagerpasswortBestaetigung);
    } catch {
      toast.error("Speichern fehlgeschlagen. Bitte nochmals versuchen.");
      return;
    } finally {
      setSpeichertLagerpasswort(false);
    }
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setAktuellesLagerpasswort(lagerpasswort);
    setLagerpasswort("");
    setLagerpasswortBestaetigung("");
    setLagerpasswortGesetzt(true);
    toast.success(result.message);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-8">
        <LockKeyhole className="size-7 text-accent" />
        <h2 className="mt-4 font-display text-2xl text-ink">Admin-Passwort</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
          Passwort für die Anmeldung der Lagerleitung ändern.
        </p>
        <AdminPasswortFormular
          nachSpeichern={() => {
            toast.success("Admin-Passwort geändert. Bitte neu anmelden.");
            logout();
            router.replace("/login?geaendert=1&redirect=/admin");
            router.refresh();
          }}
        />
      </section>

      <section className="rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-8">
        <KeyRound className="size-7 text-accent" />
        <h2 className="mt-4 font-display text-2xl text-ink">Lagerpasswort</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
          Gemeinsames Lagerpasswort für geschützte Dokumente und Fotoalben. Eine Änderung meldet bestehende Zugänge automatisch ab.
        </p>
        {lagerpasswortGesetzt === false ? (
          <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            Noch kein Lagerpasswort gesetzt – Teilnehmende können geschützte Dokumente erst öffnen, wenn hier eines gespeichert ist.
          </p>
        ) : lagerpasswortGesetzt && aktuellesLagerpasswort ? (
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-emerald-900">
            <p className="text-sm font-semibold">Aktuelles Lagerpasswort</p>
            <p className="mt-1 select-all break-all text-xl font-bold">{aktuellesLagerpasswort}</p>
          </div>
        ) : lagerpasswortGesetzt ? (
          <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            Ein Lagerpasswort ist gesetzt. Es wurde vor dieser Anzeige gespeichert und ist deshalb hier nicht
            lesbar. Gib es unten einmal neu ein, dann erscheint es hier. Bleibt es gleich, bleiben alle
            Familien angemeldet.
          </p>
        ) : null}
        <form onSubmit={lagerpasswortSpeichern} className="mt-6 space-y-4">
          <Field label="Neues Lagerpasswort" id="lagerpasswort-neu" value={lagerpasswort} onChange={setLagerpasswort} autoComplete="new-password" minLength={1} />
          <Field label="Lagerpasswort wiederholen" id="lagerpasswort-bestaetigen" value={lagerpasswortBestaetigung} onChange={setLagerpasswortBestaetigung} autoComplete="new-password" minLength={1} />
          <Button type="submit" disabled={speichertLagerpasswort}>{speichertLagerpasswort ? "Speichert…" : lagerpasswortGesetzt ? "Lagerpasswort ändern" : "Lagerpasswort setzen"}</Button>
        </form>
      </section>
    </div>
  );
}

/**
 * Admin-Passwort ändern: auf der Konto-Seite und als erzwungene Änderung des Startpassworts
 * (startpasswort). Was nach dem Speichern geschieht (Meldung, Abmelden, Ziel), bestimmt die Seite.
 */
export function AdminPasswortFormular({
  startpasswort = false,
  nachSpeichern,
}: {
  startpasswort?: boolean;
  nachSpeichern: () => void;
}) {
  const { user } = useAuth();
  const [alt, setAlt] = React.useState("");
  const [neu, setNeu] = React.useState("");
  const [wiederholt, setWiederholt] = React.useState("");
  const [speichert, setSpeichert] = React.useState(false);
  // Halb ausgefüllte Felder nicht still verlieren; beim Startpasswort führt kein anderer Weg weiter.
  useLeaveGuard(!startpasswort && !!(alt || neu || wiederholt));

  const speichern = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (neu.length < 8) {
      toast.error("Das neue Passwort braucht mindestens 8 Zeichen.");
      return;
    }
    if (neu !== wiederholt) {
      toast.error("Die Passwörter stimmen nicht überein.");
      return;
    }
    setSpeichert(true);
    try {
      await pbBrowser().collection("users").update(user.id, {
        oldPassword: alt,
        password: neu,
        passwordConfirm: wiederholt,
        ...(startpasswort ? { muss_passwort_aendern: false } : {}),
      });
    } catch {
      toast.error("Speichern fehlgeschlagen — ist das aktuelle Passwort korrekt?");
      return;
    } finally {
      setSpeichert(false);
    }
    nachSpeichern();
  };

  return (
    <form onSubmit={speichern} className="mt-6 space-y-4">
      <Field label="Aktuelles Passwort" id="passwort-alt" value={alt} onChange={setAlt} autoComplete="current-password" minLength={1} />
      <Field label="Neues Passwort (mind. 8 Zeichen)" id="passwort-neu" value={neu} onChange={setNeu} autoComplete="new-password" />
      <Field label="Neues Passwort wiederholen" id="passwort-wiederholt" value={wiederholt} onChange={setWiederholt} autoComplete="new-password" />
      <Button type="submit" disabled={speichert} size={startpasswort ? "lg" : undefined} className={startpasswort ? "w-full" : undefined}>
        {speichert ? "Speichert…" : "Passwort speichern"}
      </Button>
    </form>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  autoComplete,
  minLength = 8,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="password" minLength={minLength} required value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} />
    </div>
  );
}
