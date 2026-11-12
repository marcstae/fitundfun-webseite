/**
 * YouTube-Video direkt eingebettet (ohne Autoplay): Ein Tipp auf den YouTube-Knopf startet es.
 * youtube-nocookie setzt erst beim Abspielen Cookies; loading="lazy" lädt erst in Sichtnähe.
 */
export function YoutubeClickToPlay({ id }: { id: string }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-[1.25rem] border border-ink/[0.08] bg-navy-950">
      <iframe
        className="size-full"
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
        title="Lagervideo"
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
