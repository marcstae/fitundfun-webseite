import { cn } from "@/lib/utils";

interface HeroVideoProps {
  videoUrl?: string | null;
  posterUrl?: string | null;
  className?: string;
}

/**
 * Hero-Video: autoplay, muted, loop, playsinline. Bei prefers-reduced-motion
 * oder fehlendem Video wird nur das Poster (Standbild) gezeigt.
 */
export function HeroVideo({ videoUrl, posterUrl, className }: HeroVideoProps) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {videoUrl ? (
        <video
          className="size-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={posterUrl || undefined}
          aria-hidden="true"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : (
        posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt=""
            className="size-full object-cover"
            aria-hidden="true"
          />
        )
      )}
    </div>
  );
}
