"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPasswortFormular } from "@/components/admin/account-settings";
import { useAuth } from "@/components/providers";

export default function AdminEinrichtungPage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const justChanged = React.useRef(false);
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(justChanged.current ? "/login?geaendert=1" : "/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col px-4 py-12 sm:px-6 sm:py-16">
        <div className="h-80 animate-pulse rounded-[1.75rem] bg-white/70" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6 sm:py-16">
      <div className="rounded-[1.75rem] border border-ink/10 bg-white p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Lagerleitung
        </p>
        <h1 className="camp-display mt-3 text-3xl leading-none text-ink sm:text-4xl">
          Passwort ändern
        </h1>
        <p className="mt-4 text-sm font-semibold leading-relaxed text-muted">
          Vor der ersten Nutzung muss das Startpasswort geändert werden.
          Danach gilt nur noch das neue Passwort.
        </p>
        <AdminPasswortFormular
          startpasswort
          nachSpeichern={() => {
            toast.success("Passwort gespeichert ✓");
            justChanged.current = true;
            logout();
            router.replace("/login?geaendert=1");
          }}
        />
        <p className="mt-4 text-xs text-muted">
          Nach dem Speichern musst du dich mit dem neuen Passwort anmelden.
        </p>
      </div>
    </div>
  );
}
