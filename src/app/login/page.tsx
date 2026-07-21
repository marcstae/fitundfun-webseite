"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      const redirect = search.get("redirect") || "/";
      router.replace(redirect);
    }
  }, [isAuthenticated, loading, router, search]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim(), password);
      toast.success("Angemeldet ✓");
      const redirect = search.get("redirect") || "/";
      router.replace(redirect);
      router.refresh();
    } catch {
      toast.error("Anmeldung fehlgeschlagen — E-Mail oder Passwort falsch.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-ink/10 p-6 sm:p-8">
      <h1 className="font-display text-2xl uppercase text-ink">Login</h1>
      <p className="mt-2 text-sm text-muted">
        Anmeldung für die Lagerleitung und die Familie.
      </p>
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
        Kein Login? Die Zugänge stellt der Betreiber bereit. Passwort bei der
        Lagerleitung erfragen.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <React.Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-ink/5" />}>
        <LoginForm />
      </React.Suspense>
    </div>
  );
}

