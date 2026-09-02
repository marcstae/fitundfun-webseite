"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function localTarget(value: string | null): string {
  if (!value) return "/admin";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/admin";
}

function LoginForm() {
  const { login, logout, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      const redirect = localTarget(search.get("redirect"));
      router.replace(redirect);
    }
  }, [isAuthenticated, loading, router, search]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const userData = await login(email.trim(), password);
      if (userData.rolle !== "editor") {
        logout();
        toast.error("Dieser Zugang ist nicht für das Admin-Cockpit berechtigt.");
        return;
      }
      toast.success("Angemeldet ✓");
      if (userData.mussPasswortAendern) {
        router.replace("/admin-einrichtung");
      } else {
        const redirect = localTarget(search.get("redirect"));
        router.replace(redirect);
      }
      router.refresh();
    } catch {
      toast.error("Anmeldung fehlgeschlagen — E-Mail oder Passwort falsch.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-ink/10 bg-white p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
        Geschützter Bereich
      </p>
      <h1 className="camp-display mt-3 text-3xl leading-none text-ink sm:text-4xl">
        Admin-Login
      </h1>
      <p className="mt-4 text-sm font-semibold leading-relaxed text-muted">
        Anmeldung für die Lagerleitung.
      </p>
      {search.get("geaendert") === "1" ? (
        <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          Zugangsdaten geändert — bitte mit den neuen Daten anmelden.
        </p>
      ) : null}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Passwort</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Anmelden…" : "Anmelden"}
        </Button>
      </form>
      <p className="mt-4 text-xs text-muted">
        Geschützte Familieninhalte werden direkt beim jeweiligen Lager
        freigeschaltet.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-12 sm:px-6 sm:py-16">
      <React.Suspense fallback={<div className="h-80 animate-pulse rounded-[1.75rem] bg-white/70" />}>
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
