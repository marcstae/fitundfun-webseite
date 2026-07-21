"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers";

const NAV = [
  { href: "/lager", label: "Lager" },
  { href: "/fotos", label: "Fotos" },
  { href: "/lagerhaus", label: "Lagerhaus" },
  { href: "/kontakt", label: "Kontakt" },
];

export function SiteHeader() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/8 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center" aria-label="fit&fun Lager Brigels — Startseite">
          <Image
            src="/brigels-logo.png"
            alt="fit&fun Lager Brigels"
            width={96}
            height={40}
            priority
          />
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Hauptnavigation">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "text-sm font-bold text-ink/80 transition-colors hover:text-ink",
                pathname === n.href && "text-accent"
              )}
            >
              {n.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="text-sm font-bold text-muted transition-colors hover:text-ink"
            >
              Abmelden
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm font-bold text-muted transition-colors hover:text-ink"
            >
              Login
            </Link>
          )}
        </nav>
        <button
          className="inline-flex size-10 items-center justify-center rounded-lg text-ink hover:bg-ink/5 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Menü schliessen" : "Menü öffnen"}
          aria-expanded={open}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-ink/8 bg-white md:hidden" aria-label="Mobile Navigation">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center border-b border-ink/5 text-sm font-bold text-ink/80 last:border-0"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href={isAuthenticated ? "#" : "/login"}
              onClick={() => {
                setOpen(false);
                if (isAuthenticated) logout();
              }}
              className="flex min-h-12 items-center text-sm font-bold text-muted"
            >
              {isAuthenticated ? "Abmelden" : "Login"}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
