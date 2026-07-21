import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/8 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm font-semibold text-muted sm:flex-row sm:px-6 lg:px-8">
        <span className="font-display text-base uppercase text-ink">
          fit<span className="text-accent">&amp;</span>fun
        </span>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Footer">
          <Link href="/impressum" className="transition-colors hover:text-ink">
            Impressum
          </Link>
          <Link href="/datenschutz" className="transition-colors hover:text-ink">
            Datenschutz
          </Link>
          <Link href="/login" className="transition-colors hover:text-ink">
            Login
          </Link>
        </nav>
      </div>
    </footer>
  );
}
