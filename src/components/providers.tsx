"use client";

import * as React from "react";
import { Toaster } from "sonner";
import { pbBrowser } from "@/lib/pb";
import type { Rol } from "@/lib/pb-types";

interface AuthUser {
  id: string;
  email: string;
  rolle: Rol;
}

interface AuthCtx {
  user: AuthUser | null;
  isEditor: boolean;
  isFamilie: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthCtx | null>(null);

interface EditCtx {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  canEdit: boolean;
}

const EditContext = React.createContext<EditCtx | null>(null);

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

  React.useEffect(() => {
    const pb = pbBrowser();
    try {
      if (pb.authStore.isValid && pb.authStore.model) {
        const m = pb.authStore.model as Record<string, unknown>;
        setUser({
          id: String(m.id),
          email: String(m.email),
          rolle: (m.rolle as Rol) || "familie",
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
    const unsubscribe = pb.authStore.onChange(() => {
      const model = pb.authStore.model as Record<string, unknown> | null;
      if (model) {
        setUser({
          id: String(model.id),
          email: String(model.email),
          rolle: (model.rolle as Rol) || "familie",
        });
      } else {
        setUser(null);
        setEditMode(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const pb = pbBrowser();
    const res = await pb
      .collection("users")
      .authWithPassword(email, password);
    setUser({
      id: res.record.id,
      email: res.record.email,
      rolle: (res.record as unknown as { rolle: Rol }).rolle || "familie",
    });
  }, []);

  const logout = React.useCallback(() => {
    pbBrowser().authStore.clear();
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
