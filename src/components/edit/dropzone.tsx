"use client";

import * as React from "react";
import { UploadCloud, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DropzoneProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: false;
  onFile: (file: File) => void;
  currentName?: string | null;
  label?: string;
  hint?: string;
}

export function Dropzone({
  accept = "application/pdf",
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
    const acceptTypes = accept.split(",").map((s) => s.trim());
    if (accept && acceptTypes.length && !acceptTypes.includes(file.type)) {
      toast.error(`Falsches Format — ${accept} wählen.`);
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Datei zu gross — max. ${maxSizeMB} MB.`);
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
          <FileText className="size-4 text-accent" />
          <span className="font-semibold">{currentName}</span>
        </div>
      ) : null}
      <p className="text-sm text-muted">
        {hint || `Datei hierher ziehen oder`}
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-white hover:bg-navy-600"
      >
        <UploadCloud className="size-5" />
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
