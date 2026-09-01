"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#f5efe2] px-6 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e85f35]">
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
          className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-bold text-white hover:bg-navy-600"
        >
          Neu laden
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-xl border border-ink/15 px-5 text-sm font-bold text-ink hover:bg-ink/5"
        >
          Zur Startseite
        </Link>
      </div>
    </main>
  );
}