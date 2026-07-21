"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEdit } from "@/components/providers";

export function useEditMode() {
  return useEdit();
}

interface EditButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

/** Stift-Button — nur sichtbar im aktiven Bearbeitungsmodus. */
export function EditButton({ label, onClick, className }: EditButtonProps) {
  const { editMode } = useEditMode();
  if (!editMode) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full border border-accent/30 bg-white text-accent shadow-sm transition hover:bg-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        className
      )}
    >
      <Pencil className="size-4" />
    </button>
  );
}
