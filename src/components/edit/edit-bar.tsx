"use client";

import * as React from "react";
import { LogOut, Pencil, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/providers";
import { useEditMode } from "./edit-button";

export function EditBar() {
  const { isAuthenticated, isEditor, logout } = useAuth();
  const { editMode, setEditMode } = useEditMode();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted || !isAuthenticated || !isEditor) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-3">
      <div className="flex w-full max-w-md items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-navy-900 px-4 py-2.5 text-white shadow-2xl">
        <div className="flex items-center gap-2">
          <Pencil className="size-4 text-accent-light" />
          <span className="text-sm font-bold">Bearbeitungsmodus</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold">
            <span className={editMode ? "" : "text-white/60"}>
              {editMode ? "An" : "Aus"}
            </span>
            <Switch checked={editMode} onCheckedChange={setEditMode} aria-label="Bearbeitungsmodus" />
          </label>
          <button
            onClick={logout}
            className="inline-flex size-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Abmelden"
            title="Abmelden"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { X };
