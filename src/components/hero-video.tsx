"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface HeroVideoProps {
  videoUrl?: string | null;
  posterUrl?: string | null;
  className?: string;
}

/** Autoplaying hero video with a persistent poster fallback. */
export function HeroVideo({ videoUrl, posterUrl, className }: HeroVideoProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const requestPlayback = () => {
      video.muted = true;
      if (!document.hidden) {
        void video.play().catch(() => undefined);
      }
    };
    const resumeWhenVisible = () => {
      if (!document.hidden) requestPlayback();
    };

    requestPlayback();
    video.addEventListener("canplay", requestPlayback);
    document.addEventListener("visibilitychange", resumeWhenVisible);
    return () => {
      video.removeEventListener("canplay", requestPlayback);
      document.removeEventListener("visibilitychange", resumeWhenVisible);
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
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={posterUrl || undefined}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
