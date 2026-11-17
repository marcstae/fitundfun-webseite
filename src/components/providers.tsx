"use client";

import * as React from "react";
import { ClientResponseError, type default as PocketBase } from "pocketbase";
import { usePathname, useRouter } from "next/navigation";
import { pbBrowser } from "@/lib/pb";
import type { Rol } from "@/lib/pb-types";

interface AuthUser {
  id: string;
  email: string;
  rolle: Rol;
  mussPasswortAendern: boolean;
}

interface AuthCtx {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthCtx | null>(null);

function syncAuthCookie(pb: PocketBase) {
  document.cookie = pb.authStore.exportToCookie({
    httpOnly: false,
    secure: window.location.protocol === "https:",
    sameSite: "lax",
    path: "/",
  });
}

function userFromModel(model: Record<string, unknown>): AuthUser {
  return {
    id: String(model.id),
    email: String(model.email),
    rolle: (model.rolle as Rol) || "familie",
    mussPasswortAendern: model.muss_passwort_aendern === true,
  };
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth muss innerhalb <Providers> verwendet werden");
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    const pb = pbBrowser();
    // Jedes save() und clear() des SDK löst onChange aus (Anmelden, Erneuern, Abmelden): Zustand und
    // Cookie werden nur hier nachgeführt.
    const unsubscribe = pb.authStore.onChange(() => {
      const record = pb.authStore.record;
      setUser(record ? userFromModel(record) : null);
      syncAuthCookie(pb);
    });

    let active = true;
    void (async () => {
      try {
        if (pb.authStore.isValid) {
          await pb.collection("users").authRefresh();
        } else {
          pb.authStore.clear();
        }
      } catch (e) {
        // Abmelden nur, wenn PocketBase das Token ablehnt. Ein abgebrochener Abruf (Seite wird gerade
        // verlassen, z. B. gleich nach dem Wechsel Login → Cockpit), Netz- oder Serverfehler lassen die
        // Anmeldung stehen; save() meldet sie trotzdem an onChange, damit user gesetzt ist.
        if (e instanceof ClientResponseError && (e.status === 401 || e.status === 403)) pb.authStore.clear();
        else pb.authStore.save(pb.authStore.token, pb.authStore.record);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Erzwungene Zugangsdaten-Änderung: nur die Änderungsseite (+Login/Abmelden) zulassen.
  React.useEffect(() => {
    if (
      !loading &&
      user?.mussPasswortAendern &&
      pathname !== "/admin-einrichtung" &&
      pathname !== "/login"
    ) {
      router.replace("/admin-einrichtung");
    }
  }, [loading, user, pathname, router]);

  const login = React.useCallback(async (email: string, password: string) => {
    const pb = pbBrowser();
    // Das SDK schickt ein gespeichertes Token auch bei der Anmeldung mit. Seit PocketBase 0.42 lehnt
    // der Server ein ungültig gewordenes Token (z. B. Passwort anderswo geändert) dabei mit 401 ab.
    pb.authStore.clear();
    const res = await pb
      .collection("users")
      .authWithPassword(email, password);
    return userFromModel(res.record);
  }, []);

  const logout = React.useCallback(() => {
    pbBrowser().authStore.clear();
  }, []);

  const auth: AuthCtx = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
