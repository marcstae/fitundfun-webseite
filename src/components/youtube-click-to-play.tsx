"use client";

import * as React from "react";
import { PlayCircle } from "lucide-react";
import { youtubeThumb } from "@/lib/utils";

/** YouTube-Embed über youtube-nocookie, erst nach Klick geladen. */
export function YoutubeClickToPlay({ id }: { id: string }) {
  const [play, setPlay] = React.useState(false);
  const thumb = youtubeThumb(id);
  if (play) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-ink/10">
        <iframe
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
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-ink/10">
      <button
        type="button"
        onClick={() => setPlay(true)}
        className="group relative size-full"
        aria-label="Video abspielen"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt="Vorschaubild Video"
          className="size-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-navy-950/30 transition group-hover:bg-navy-950/20">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-white shadow-lg">
            <PlayCircle className="size-5" /> Video abspielen
          </span>
        </span>
      </button>
    </div>
  );
}
