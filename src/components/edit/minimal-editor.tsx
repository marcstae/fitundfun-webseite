"use client";

import * as React from "react";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MinimalEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Minimaler Rich-Text-Editor (Bold, Kursiv, Aufzählung, Link).
 * Bewusst kein TipTap — weniger Dependencies, gleiche DAU-Sicherheit.
 * Ausgabe wird beim Rendern sanitized (Whitelist p/br/strong/em/ul/ol/li/a).
 */
export function MinimalEditor({
  value,
  onChange,
  placeholder,
  className,
}: MinimalEditorProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    ref.current?.focus();
    onChange(ref.current?.innerHTML || "");
  };

  const addLink = () => {
    const url = window.prompt("Link-URL (https://…)");
    if (url) exec("createLink", url);
  };

  const tools = [
    { icon: Bold, cmd: "bold", label: "Fett" },
    { icon: Italic, cmd: "italic", label: "Kursiv" },
    { icon: List, cmd: "insertUnorderedList", label: "Aufzählung" },
    { icon: ListOrdered, cmd: "insertOrderedList", label: "Nummerierung" },
  ];

  return (
    <div className={cn("rounded-xl border border-ink/15", className)}>
      <div className="flex items-center gap-1 border-b border-ink/10 bg-ink/[0.02] px-2 py-1.5">
        {tools.map((t) => (
          <button
            key={t.cmd}
            type="button"
            title={t.label}
            aria-label={t.label}
            onClick={() => exec(t.cmd)}
            className="inline-flex size-8 items-center justify-center rounded-md text-ink/70 hover:bg-ink/10 hover:text-ink"
          >
            <t.icon className="size-4" />
          </button>
        ))}
        <button
          type="button"
          title="Link"
          aria-label="Link einfügen"
          onClick={addLink}
          className="inline-flex size-8 items-center justify-center rounded-md text-ink/70 hover:bg-ink/10 hover:text-ink"
        >
          <LinkIcon className="size-4" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={() => onChange(ref.current?.innerHTML || "")}
        className="min-h-[120px] px-4 py-3 text-base text-ink focus:outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-accent [&_a]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-muted/60"
      />
    </div>
  );
}
