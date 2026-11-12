"use client";

import * as React from "react";
import { PlayCircle } from "lucide-react";

/**
 * YouTube-Embed über youtube-nocookie, erst nach Klick geladen. Vorher wird bewusst
 * nichts von Google geladen (auch kein Vorschaubild), damit keine IP abfliesst.
 */
export function YoutubeClickToPlay({ id }: { id: string }) {
  const [play, setPlay] = React.useState(false);
  if (play) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-ink/10 bg-navy-950">
        <iframe
          ref={(frame) => frame?.focus()}
          className="size-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title="Lagervideo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-ink/10">
      <button
        type="button"
        onClick={() => setPlay(true)}
        className="group relative flex size-full flex-col items-center justify-center gap-3 bg-navy-950 p-4 text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-white shadow-lg transition group-hover:bg-accent-light group-hover:text-ink">
          <PlayCircle className="size-5" aria-hidden /> Video abspielen
        </span>
        <span className="text-xs text-white/70">Wird von YouTube geladen</span>
      </button>
    </div>
  );
}
