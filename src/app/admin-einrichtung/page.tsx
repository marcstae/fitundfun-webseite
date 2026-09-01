"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/providers";
import { pbBrowser } from "@/lib/pb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminEinrichtungPage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const [oldPassword, setOldPassword] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !user) {
    return (
      <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
        <div className="h-64 animate-pulse rounded-2xl bg-ink/5" />
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Das Passwort braucht mindestens 8 Zeichen.");
      return;
    }
    if (password !== confirm) {
      toast.error("Die Passwörter stimmen nicht überein.");
      return;
    }
    setBusy(true);
    try {
      await pbBrowser().collection("users").update(user.id, {
        oldPassword,
        password,
        passwordConfirm: confirm,
        muss_passwort_aendern: false,
      });
      toast.success("Passwort gespeichert ✓");
      logout();
      router.replace("/login?geaendert=1");
    } catch {
      toast.error("Speichern fehlgeschlagen — aktuelles Passwort falsch?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-ink/10 p-6 sm:p-8">
        <h1 className="font-display text-2xl uppercase text-ink">
          Passwort ändern
        </h1>
        <p className="mt-2 text-sm text-muted">
          Vor der ersten Nutzung muss das Standard-Passwort geändert werden.
          Danach gilt nur noch das neue Passwort.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="old-password">Aktuelles Passwort</Label>
            <Input
              id="old-password"
              type="password"
              autoComplete="current-password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Neues Passwort (mind. 8 Zeichen)</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Passwort wiederholen</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Speichert…" : "Passwort speichern"}
          </Button>
        </form>
        <p className="mt-4 text-xs text-muted">
          Nach dem Speichern musst du dich mit dem neuen Passwort anmelden.
        </p>
      </div>
    </div>
  );
}