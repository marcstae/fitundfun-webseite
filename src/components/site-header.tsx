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
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();
  const isHome = pathname === "/";
  const homeAtTop = isHome && !scrolled && !open;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          "sticky top-0 z-40 transition-all duration-300",
          homeAtTop
            ? "bg-[#f5efe2]"
            : "border-b border-ink/[0.08] bg-white/[0.92] shadow-[0_8px_30px_rgba(14,28,48,0.04)] backdrop-blur-xl"
        )}
      >
        <div className="mx-auto flex h-16 max-w-[96rem] items-center justify-between px-4 sm:px-6 lg:px-8">
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
              className="h-auto w-24 sm:w-28"
            />
          </Link>

          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Direktnavigation">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-bold text-ink/65 transition-colors hover:bg-ink/5 hover:text-ink",
                    item.href === pathname && "bg-ink text-white hover:bg-ink hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={() => setOpen(true)}
              aria-label="Menü öffnen"
              className="inline-flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
            >
              <Menu className="size-6" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 bg-navy-900/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <span className="font-display text-sm uppercase tracking-[0.3em] text-white/60">
              fit&fun Brigels
            </span>
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
