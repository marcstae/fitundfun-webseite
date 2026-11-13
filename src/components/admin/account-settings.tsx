"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { changeFamilyPassword } from "@/app/admin/konto/actions";
import { useAuth } from "@/components/providers";
import { useLeaveGuard } from "@/components/edit/save-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pbBrowser } from "@/lib/pb";
import type { FamilienzugangRecord } from "@/lib/pb-types";

export function AccountSettings() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [oldPassword, setOldPassword] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [familyPassword, setFamilyPassword] = React.useState("");
  const [familyConfirmation, setFamilyConfirmation] = React.useState("");
  const [savingAdmin, setSavingAdmin] = React.useState(false);
  const [savingFamily, setSavingFamily] = React.useState(false);
  const [familySet, setFamilySet] = React.useState<boolean | null>(null);
  const [familyCurrent, setFamilyCurrent] = React.useState("");
  // Halb ausgefüllte Passwortfelder nicht still verlieren.
  useLeaveGuard(!!(oldPassword || password || confirmation || familyPassword || familyConfirmation));

  React.useEffect(() => {
    pbBrowser()
      .collection("familienzugang")
      .getList<FamilienzugangRecord>(1, 1)
      .then((result) => {
        setFamilySet(!!result.items[0]?.password_hash);
        setFamilyCurrent(result.items[0]?.passwort || "");
      })
      .catch(() => setFamilySet(null));
  }, []);

  const saveAdminPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (password.length < 8) {
      toast.error("Das neue Passwort braucht mindestens 8 Zeichen.");
      return;
    }
    if (password !== confirmation) {
      toast.error("Die Passwörter stimmen nicht überein.");
      return;
    }
    setSavingAdmin(true);
    try {
      await pbBrowser().collection("users").update(user.id, {
        oldPassword,
        password,
        passwordConfirm: confirmation,
      });
      toast.success("Admin-Passwort geändert. Bitte neu anmelden.");
      logout();
      router.replace("/login?geaendert=1&redirect=/admin");
      router.refresh();
    } catch {
      toast.error("Änderung fehlgeschlagen — ist das aktuelle Passwort korrekt?");
    } finally {
      setSavingAdmin(false);
    }
  };

  const saveFamilyPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingFamily(true);
    const result = await changeFamilyPassword(familyPassword, familyConfirmation);
    setSavingFamily(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setFamilyCurrent(familyPassword);
    setFamilyPassword("");
    setFamilyConfirmation("");
    setFamilySet(true);
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
        <form onSubmit={saveAdminPassword} className="mt-6 space-y-4">
          <Field label="Aktuelles Passwort" id="account-old" value={oldPassword} onChange={setOldPassword} autoComplete="current-password" />
          <Field label="Neues Passwort" id="account-new" value={password} onChange={setPassword} autoComplete="new-password" />
          <Field label="Neues Passwort wiederholen" id="account-confirm" value={confirmation} onChange={setConfirmation} autoComplete="new-password" />
          <Button type="submit" disabled={savingAdmin}>{savingAdmin ? "Speichert…" : "Admin-Passwort ändern"}</Button>
        </form>
      </section>

      <section className="rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-8">
        <KeyRound className="size-7 text-accent" />
        <h2 className="mt-4 font-display text-2xl text-ink">Lagerpasswort</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
          Gemeinsames Lagerpasswort für geschützte Dokumente und Fotoalben. Eine Änderung meldet bestehende Zugänge automatisch ab.
        </p>
        {familySet === false ? (
          <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            Noch kein Lagerpasswort gesetzt – Teilnehmende können geschützte Dokumente erst öffnen, wenn hier eines gespeichert ist.
          </p>
        ) : familySet && familyCurrent ? (
          <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-emerald-900">
            <p className="text-sm font-semibold">Aktuelles Lagerpasswort</p>
            <p className="mt-1 select-all break-all text-xl font-bold">{familyCurrent}</p>
          </div>
        ) : familySet ? (
          <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            Ein Lagerpasswort ist gesetzt. Es wurde vor dieser Anzeige gespeichert und ist deshalb hier nicht
            lesbar. Gib es unten einmal neu ein, dann erscheint es hier. Bleibt es gleich, bleiben alle
            Familien angemeldet.
          </p>
        ) : null}
        <form onSubmit={saveFamilyPassword} className="mt-6 space-y-4">
          <Field label="Neues Lagerpasswort" id="family-new" value={familyPassword} onChange={setFamilyPassword} autoComplete="new-password" minLength={1} />
          <Field label="Lagerpasswort wiederholen" id="family-confirm" value={familyConfirmation} onChange={setFamilyConfirmation} autoComplete="new-password" minLength={1} />
          <Button type="submit" disabled={savingFamily}>{savingFamily ? "Speichert…" : familySet ? "Lagerpasswort ändern" : "Lagerpasswort setzen"}</Button>
        </form>
      </section>
    </div>
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
