"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { changeFamilyPassword } from "@/app/admin/konto/actions";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pbBrowser } from "@/lib/pb";

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
    setFamilyPassword("");
    setFamilyConfirmation("");
    toast.success(result.message);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-[1.75rem] border border-ink/10 bg-white p-6 sm:p-8">
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

      <section className="rounded-[1.75rem] border border-ink/10 bg-white p-6 sm:p-8">
        <KeyRound className="size-7 text-accent" />
        <h2 className="mt-4 font-display text-2xl text-ink">Familienpasswort</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
          Gemeinsames Passwort für geschützte Dokumente und Fotoalben. Eine Änderung meldet bestehende Familienzugänge automatisch ab.
        </p>
        <form onSubmit={saveFamilyPassword} className="mt-6 space-y-4">
          <Field label="Neues Familienpasswort" id="family-new" value={familyPassword} onChange={setFamilyPassword} autoComplete="new-password" />
          <Field label="Familienpasswort wiederholen" id="family-confirm" value={familyConfirmation} onChange={setFamilyConfirmation} autoComplete="new-password" />
          <Button type="submit" disabled={savingFamily}>{savingFamily ? "Speichert…" : "Familienpasswort ändern"}</Button>
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
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="password" minLength={8} required value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} />
    </div>
  );
}
