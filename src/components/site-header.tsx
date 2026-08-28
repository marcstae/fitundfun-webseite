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
  const isHome = pathname === "/";

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "z-40",
          isHome
            ? "absolute inset-x-0 top-2 bg-transparent sm:top-3"
            : "sticky top-0 border-b border-ink/[0.08] bg-white/[0.92] shadow-[0_8px_30px_rgba(14,28,48,0.04)] backdrop-blur-xl"
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-[96rem] items-center justify-between",
            isHome
              ? "h-20 px-7 sm:px-11 lg:px-[3.75rem]"
              : "h-16 px-4 sm:px-6 lg:px-8"
          )}
        >
          <Link
            href="/"
            className="flex items-center"
            aria-label="fit&fun Lager Brigels — Startseite"
          >
            <Image
              src="/brigels-logo.png"
              alt="fit&fun Lager Brigels"
              width={112}
              height={46}
              priority
              className={cn(
                "h-auto w-24 sm:w-28",
                isHome && "brightness-0 invert drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
              )}
            />
          </Link>

          <button
            onClick={() => setOpen(true)}
            aria-label="Menü öffnen"
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-full transition-colors",
              isHome
                ? "text-white hover:bg-white/10"
                : "text-ink hover:bg-ink/5"
            )}
          >
            <Menu className="size-6" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 bg-navy-900/95 backdrop-blur-sm">
          <div className="mx-auto flex h-20 max-w-[96rem] items-center justify-between px-7 sm:px-11 lg:px-[3.75rem]">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center"
              aria-label="fit&fun Lager Brigels — Startseite"
            >
              <Image
                src="/brigels-logo.png"
                alt="fit&fun Lager Brigels"
                width={112}
                height={46}
                className="h-auto w-24 brightness-0 invert sm:w-28"
              />
            </Link>
            <button
              onClick={() => setOpen(false)}
              aria-label="Menü schliessen"
              className="inline-flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            >
              <X className="size-6" />
            </button>
          </div>
          <nav
            className="mx-auto flex max-w-6xl flex-col px-4 pt-4 sm:px-6 lg:px-8"
            aria-label="Hauptnavigation"
          >
            {NAV.map((n, i) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between border-b border-white/10 py-5 font-display text-3xl uppercase tracking-tight text-white transition-colors hover:text-accent-light",
                  n.href === pathname && "text-accent-light"
                )}
              >
                {n.label}
                <span className="text-xs font-bold tracking-[0.3em] text-white/30">
                  0{i + 1}
                </span>
              </Link>
            ))}
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex items-center border-b border-white/10 py-5 text-left font-display text-3xl uppercase tracking-tight text-white/50 transition-colors hover:text-white"
              >
                Abmelden
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center border-b border-white/10 py-5 font-display text-3xl uppercase tracking-tight text-white/50 transition-colors hover:text-white"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
