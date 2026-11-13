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
  /** Kleine Vorschau des aktuellen Bilds oder Videos (gleich für alle Medienfelder im Cockpit). */
  preview?: string;
  video?: boolean;
}

/** Vorschau-URL für eine gewählte, noch nicht gespeicherte Datei; wird beim Wechsel freigegeben. */
export function useDateiUrl(file: File | null) {
  const url = React.useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  React.useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return url;
}

export function Dropzone({
  accept = "application/pdf",
  formats = "eine passende Datei",
  maxSizeMB = 20,
  onFile,
  currentName,
  label = "Datei auswählen",
  hint,
  preview,
  video,
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

  const waehlen = (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="mt-3 inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-4 text-sm font-bold text-white hover:bg-ink sm:px-5"
    >
      <UploadCloud className="size-5" aria-hidden />
      {label}
    </button>
  );

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
      {preview ? (
        <div className="flex items-center gap-4 text-left">
          {video ? (
            // #t=0.1: Safari zeigt sonst kein erstes Bild.
            <video src={`${preview}#t=0.1`} muted playsInline preload="metadata" aria-hidden className={VORSCHAU} />
          ) : (
            <img src={preview} alt="" className={VORSCHAU} />
          )}
          <div className="min-w-0 flex-1">
            {currentName ? <p className="truncate text-sm font-semibold text-ink">{currentName}</p> : null}
            <p className="mt-0.5 hidden text-xs text-muted sm:block">{hint || "Datei hierher ziehen oder"}</p>
            {waehlen}
          </div>
        </div>
      ) : (
        <>
          {currentName ? (
            <div className="mb-2 flex items-center justify-center gap-2 text-sm text-ink">
              <FileText className="size-4 shrink-0 text-accent" aria-hidden />
              <span className="min-w-0 truncate font-semibold">{currentName}</span>
            </div>
          ) : null}
          <p className="hidden text-sm text-muted sm:block">
            {hint || `Datei hierher ziehen oder`}
          </p>
          {waehlen}
        </>
      )}
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

const VORSCHAU = "aspect-video w-24 shrink-0 rounded-lg bg-sand object-cover sm:w-40";
