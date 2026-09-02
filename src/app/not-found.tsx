import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
        Fehler 404
      </span>
      <h1 className="camp-display mt-4 text-4xl leading-none text-ink sm:text-6xl">
        Seite nicht gefunden
      </h1>
      <p className="mt-5 max-w-md text-sm font-semibold leading-relaxed text-muted">
        Diese Seite gibt es nicht — vielleicht ist sie archiviert.
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-bold text-white transition-colors hover:bg-ink"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
