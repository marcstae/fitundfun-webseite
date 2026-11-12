"use client";

import * as React from "react";
import { UploadCloud, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DropzoneProps {
  /** MIME-Typen, «image/*» oder Endungen wie «.docx», kommagetrennt. */
  accept?: string;
  /** Lesbare Formatangabe für Fehlermeldungen, z. B. «PDF oder Word (.docx)». */
  formats?: string;
  maxSizeMB?: number;
  multiple?: false;
  onFile: (file: File) => void;
  currentName?: string | null;
  label?: string;
  hint?: string;
}

export function Dropzone({
  accept = "application/pdf",
  formats = "eine passende Datei",
  maxSizeMB = 20,
  onFile,
  currentName,
  label = "Datei auswählen",
  hint,
}: DropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    // Manche Handys liefern bei Word-Dateien keinen MIME-Typ, deshalb auch die Endung prüfen.
    const ok = accept
      .split(",")
      .map((type) => type.trim())
      .some((type) =>
        type.startsWith(".")
          ? name.endsWith(type)
          : type.endsWith("/*")
            ? file.type.startsWith(type.slice(0, -1))
            : type === file.type
      );
    if (!ok) {
      toast.error(`Dieses Format geht hier nicht – bitte ${formats} wählen.`);
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Datei zu gross – höchstens ${maxSizeMB} MB.`);
      return;
    }
    onFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "rounded-xl border-2 border-dashed border-ink/20 p-5 text-center transition",
        dragOver ? "border-accent bg-accent/5" : "hover:border-ink/40"
      )}
    >
      {currentName ? (
        <div className="mb-2 flex items-center justify-center gap-2 text-sm text-ink">
          <FileText className="size-4 shrink-0 text-accent" aria-hidden />
          <span className="min-w-0 truncate font-semibold">{currentName}</span>
        </div>
      ) : null}
      <p className="hidden text-sm text-muted sm:block">
        {hint || `Datei hierher ziehen oder`}
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-white hover:bg-ink"
      >
        <UploadCloud className="size-5" aria-hidden />
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
