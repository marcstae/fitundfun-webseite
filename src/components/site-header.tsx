"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers";

interface SiteHeaderProps {
  aktuellesJahr: number | null;
}

interface NavItem {
  href: string;
  label: string;
  description?: string;
  matchChildren?: boolean;
}

export function SiteHeader({ aktuellesJahr }: SiteHeaderProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();
  const isHome = pathname === "/";
  const nav: NavItem[] = [
    ...(aktuellesJahr
      ? [
          {
            href: `/lager/${aktuellesJahr}`,
            label: `Lager ${aktuellesJahr}`,
            description: "Infos, Anmeldung & Dokumente",
            matchChildren: true,
          },
        ]
      : []),
    { href: "/lager", label: "Frühere Lager" },
    { href: "/lagerhaus", label: "Lagerhaus", matchChildren: true },
    { href: "/kontakt", label: "Kontakt", matchChildren: true },
  ];

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <header
        className={cn(
          "z-40",
          isHome
            ? "absolute inset-x-0 top-5 bg-transparent sm:top-7"
            : "sticky top-0 border-b border-ink/[0.08] bg-white/[0.92] shadow-[0_8px_30px_rgba(14,28,48,0.04)] backdrop-blur-xl"
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-[96rem] items-center justify-between",
            isHome
              ? "h-16 px-7 sm:px-11 lg:px-[3.75rem]"
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

          <DialogPrimitive.Trigger asChild>
            <button
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
          </DialogPrimitive.Trigger>
        </div>
      </header>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed inset-0 z-[51] overflow-y-auto bg-navy-900/95 text-white outline-none">
          <DialogPrimitive.Title className="sr-only">
            Hauptnavigation
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Navigation der fit&fun Lagerwebsite
          </DialogPrimitive.Description>

          <div className="mx-auto flex min-h-dvh max-w-[96rem] flex-col">
            <div className="flex h-20 shrink-0 items-center justify-between px-7 sm:px-11 lg:px-[3.75rem]">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3"
                aria-label="Zur Startseite"
              >
                <Image
                  src="/brigels-logo.png"
                  alt=""
                  width={112}
                  height={46}
                  className="h-auto w-24 brightness-0 invert sm:w-28"
                />
                <span className="text-sm font-bold uppercase tracking-wider text-white/75">
                  Startseite
                </span>
              </Link>
              <DialogPrimitive.Close asChild>
                <button
                  aria-label="Menü schliessen"
                  className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/15"
                >
                  <span aria-hidden>×</span>
                </button>
              </DialogPrimitive.Close>
            </div>

            <nav
              className="mx-auto flex w-full max-w-6xl flex-col px-4 pt-2 sm:px-6 lg:px-8"
              aria-label="Hauptnavigation"
            >
              {nav.map((item, index) => {
                const active =
                  pathname === item.href ||
                  (item.matchChildren && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-20 items-center justify-between gap-5 border-b border-white/10 py-4 text-white transition-colors hover:text-accent-light sm:py-5",
                      active && "text-accent-light"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block font-display text-3xl uppercase tracking-tight">
                        {item.label}
                      </span>
                      {item.description ? (
                        <span className="mt-1 block text-xs font-semibold text-white/55">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 text-xs font-bold tracking-[0.3em] text-white/30"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <nav
              className="mx-auto mt-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 px-4 py-6 text-sm font-semibold text-white/65 sm:px-6 lg:px-8"
              aria-label="Weitere Navigation"
            >
              <Link href="/sponsoren" onClick={() => setOpen(false)} className="hover:text-white">
                Sponsoren
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/admin" onClick={() => setOpen(false)} className="hover:text-white">
                    Admin-Cockpit
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className="hover:text-white"
                  >
                    Abmelden
                  </button>
                </>
              ) : (
                <Link
                  href={`/login?redirect=${encodeURIComponent(pathname)}`}
                  onClick={() => setOpen(false)}
                  className="hover:text-white"
                >
                  Admin-Login
                </Link>
              )}
              <Link href="/impressum" onClick={() => setOpen(false)} className="hover:text-white">
                Impressum
              </Link>
              <Link href="/datenschutz" onClick={() => setOpen(false)} className="hover:text-white">
                Datenschutz
              </Link>
            </nav>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
