"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface HeroVideoProps {
  videoUrl?: string | null;
  posterUrl?: string | null;
  className?: string;
}

/**
 * Hintergrundvideo mit Posterbild. Startet nur per Skript (kein autoPlay-Attribut), damit
 * bei «Bewegung reduzieren» nur das Posterbild erscheint und keine Videodaten geladen werden.
 */
export function HeroVideo({ videoUrl, posterUrl, className }: HeroVideoProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const requestPlayback = () => {
      if (document.hidden) return;
      video.muted = true;
      void video.play().catch(() => undefined);
    };

    requestPlayback();
    video.addEventListener("canplay", requestPlayback);
    document.addEventListener("visibilitychange", requestPlayback);
    return () => {
      video.removeEventListener("canplay", requestPlayback);
      document.removeEventListener("visibilitychange", requestPlayback);
    };
  }, [videoUrl]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
          aria-hidden="true"
        />
      )}
      {videoUrl && (
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover"
          src={videoUrl}
          muted
          loop
          playsInline
          preload="none"
          poster={posterUrl || undefined}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
