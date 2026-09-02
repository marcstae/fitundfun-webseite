"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-sand px-6 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
        Hoppla
      </p>
      <h1 className="camp-display text-4xl text-ink sm:text-5xl">
        Etwas ist schiefgelaufen.
      </h1>
      <p className="max-w-md text-sm font-semibold leading-relaxed text-muted">
        Die Seite konnte nicht geladen werden. Versuch es neu — falls das
        Problem bleibt, melde dich bei der Lagerleitung.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-bold text-white transition-colors hover:bg-ink"
        >
          Neu laden
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full border border-ink/15 bg-white px-5 text-sm font-bold text-ink transition-colors hover:bg-ink/5"
        >
          Zur Startseite
        </Link>
      </div>
    </main>
  );
}
