import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="font-display text-6xl text-accent">404</span>
      <h1 className="mt-4 font-display text-2xl uppercase text-ink">Seite nicht gefunden</h1>
      <p className="mt-2 text-sm text-muted">
        Diese Seite gibt es nicht — vielleicht ist sie archiviert.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-bold text-white hover:bg-navy-600"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
