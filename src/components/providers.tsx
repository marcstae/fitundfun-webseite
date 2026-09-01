"use client";

import * as React from "react";
import { Toaster } from "sonner";
import type PocketBase from "pocketbase";
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
  isEditor: boolean;
  isFamilie: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthCtx | null>(null);

interface EditCtx {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  canEdit: boolean;
}

const EditContext = React.createContext<EditCtx | null>(null);

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

export function useEdit() {
  const ctx = React.useContext(EditContext);
  if (!ctx) throw new Error("useEdit muss innerhalb <Providers> verwendet werden");
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editMode, setEditMode] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    const pb = pbBrowser();
    try {
      if (pb.authStore.isValid && pb.authStore.model) {
        const m = pb.authStore.model as Record<string, unknown>;
        setUser(userFromModel(m));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
    syncAuthCookie(pb);
    const unsubscribe = pb.authStore.onChange(() => {
      const model = pb.authStore.model as Record<string, unknown> | null;
      if (model) {
        setUser(userFromModel(model));
      } else {
        setUser(null);
        setEditMode(false);
      }
      syncAuthCookie(pb);
    });
    return () => unsubscribe();
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
    const res = await pb
      .collection("users")
      .authWithPassword(email, password);
    syncAuthCookie(pb);
    const next = userFromModel(res.record as unknown as Record<string, unknown>);
    setUser(next);
    return next;
  }, []);

  const logout = React.useCallback(() => {
    pbBrowser().authStore.clear();
    syncAuthCookie(pbBrowser());
    setUser(null);
    setEditMode(false);
  }, []);

  const auth: AuthCtx = {
    user,
    isEditor: user?.rolle === "editor",
    isFamilie: user?.rolle === "familie",
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  const edit: EditCtx = {
    editMode,
    setEditMode,
    canEdit: user?.rolle === "editor",
  };

  return (
    <AuthContext.Provider value={auth}>
      <EditContext.Provider value={edit}>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: { borderRadius: "12px", fontFamily: "var(--font-archivo)" },
          }}
          richColors
        />
      </EditContext.Provider>
    </AuthContext.Provider>
  );
}