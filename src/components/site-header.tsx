"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  FileText,
  History,
  House,
  Images,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers";

// Reihenfolge nach Häufigkeit: Fotos und Kontakt vor Lagerhaus und Archiv.
const NAV = [
  { href: "/fotos", label: "Fotos & Videos", hint: "Fotoalbum · mit Familienpasswort", Icon: Images },
  { href: "/kontakt", label: "Kontakt", hint: "Fragen an die Lagerleitung", Icon: Mail },
  { href: "/lagerhaus", label: "Lagerhaus", hint: "Unterkunft & Lage in Brigels", Icon: House },
  { href: "/lager", label: "Frühere Lager", hint: "Alle Lager seit 2007", Icon: History },
];

const ROW =
  "-mx-3 flex min-h-[3.75rem] items-center gap-3.5 rounded-r-xl px-3 py-2 text-ink hover:bg-sand active:bg-sand aria-[current=page]:bg-sand aria-[current=page]:shadow-[inset_3px_0_0_var(--color-ink)]";
const META =
  "flex min-h-12 items-center rounded-xl px-2 text-sm font-semibold text-muted hover:bg-sand hover:text-ink active:bg-sand aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:underline-offset-4";
const ON_NAVY_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light";

export function SiteHeader({
  aktuellesJahr,
  lagerZeitraum,
}: {
  aktuellesJahr: number | null;
  lagerZeitraum: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const { isEditor, logout } = useAuth();
  const isHome = pathname === "/";
  const lagerHref = aktuellesJahr ? `/lager/${aktuellesJahr}` : null;
  const isActive = (href: string) =>
    href === "/lager"
      ? pathname === "/lager" || (pathname.startsWith("/lager/") && pathname !== lagerHref)
      : pathname === href || pathname.startsWith(`${href}/`);
  const meta: [string, string][] = [
    isEditor
      ? ["/admin", "Admin-Cockpit"]
      : [`/login?redirect=${encodeURIComponent(pathname)}`, "Admin-Login"],
  ];

  // Zurück/Vor-Geste bei offenem Menü. Scroll-Lock macht Radix (RemoveScroll im Overlay).
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <header
        className={cn(
          "z-40",
          // Startseite: Logo und Menü sitzen gleich weit vom Rahmen entfernt wie der Inhalt
          // (Rahmen 20/28 px vom Rand + 16/24/32 px Abstand).
          isHome
            ? "absolute inset-x-0 top-9 bg-transparent sm:top-[3.25rem] lg:top-[3.75rem]"
            : "sticky top-0 border-b border-ink/[0.08] bg-white/[0.92] shadow-[0_8px_30px_rgba(14,28,48,0.04)] backdrop-blur-xl"
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-[96rem] items-center justify-between",
            isHome
              ? "h-10 px-9 sm:h-12 sm:px-[3.25rem] lg:px-[3.75rem]"
              : "h-16 px-4 sm:px-6 lg:px-8"
          )}
        >
          <Link
            href="/"
            className="flex items-center"
            aria-label="fit&fun Lager Brigels – Startseite"
          >
            <Image
              src="/brigels-logo.png"
              alt=""
              width={112}
              height={46}
              loading="eager"
              className={cn(
                "h-auto w-24 sm:w-28",
                isHome && "brightness-0 invert drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
              )}
            />
          </Link>

          {/* Schlicht wie die Ortszeile im Startbild: Text und Symbol ohne Rahmen; Fläche bleibt 48 px. */}
          {/* aria-label, weil Chrome sonst den Grossbuchstaben-Text «MENÜ» vorliest. */}
          <Dialog.Trigger
            aria-label="Menü"
            className={cn(
              // Optischer Ausgleich: -mr 15px, weil das Symbol 3 px Innenrand hat; Grossbuchstaben
              // sitzen 1 px zu hoch. So liegen Text, Symbol und Logo auf einer Mitte und Kante.
              "-mr-[14px] inline-flex h-12 items-center gap-2.5 rounded-full px-3 text-xs font-bold uppercase tracking-[0.16em] transition-opacity sm:-mr-[15px] hover:opacity-70 active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
              isHome
                ? "-translate-y-[3px] text-white [filter:drop-shadow(0_1px_6px_rgba(0,0,0,0.45))] sm:-translate-y-0.5"
                : "text-ink"
            )}
          >
            <span className="translate-y-px">Menü</span>
            <Menu aria-hidden className="size-6" strokeWidth={2.25} />
          </Dialog.Trigger>
        </div>
      </header>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-950/60 transition-opacity duration-200 starting:opacity-0" />
        <Dialog.Content
          aria-describedby={undefined}
          // Ein Handler für alle Links: schliesst auch bei Hash-Links und der aktuellen Seite.
          onClick={(event) => {
            if ((event.target as Element).closest("a")) setOpen(false);
          }}
          className="fixed inset-x-0 bottom-0 z-[51] flex max-h-[calc(100dvh-3rem)] flex-col overflow-y-auto overscroll-contain rounded-t-[1.75rem] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-ink shadow-[0_-12px_40px_rgba(14,28,48,0.18)] outline-none transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] starting:translate-y-full sm:inset-y-0 sm:left-auto sm:max-h-none sm:w-96 sm:rounded-l-[1.75rem] sm:rounded-tr-none sm:px-5 sm:starting:translate-x-full sm:starting:translate-y-0"
        >
          <Dialog.Title className="sr-only">Menü</Dialog.Title>

          <div className="sticky top-0 z-10 -mx-4 flex h-16 shrink-0 items-center justify-between bg-white px-4 sm:-mx-5 sm:px-5">
            {/* Nur das Logo, ohne Text: ruhiger; bleibt ein Link zur Startseite. */}
            <Link
              href="/"
              aria-label="Startseite"
              aria-current={isHome ? "page" : undefined}
              className="-ml-2 flex min-h-12 items-center rounded-xl px-2 active:bg-sand"
            >
              <Image src="/brigels-logo.png" alt="" width={112} height={46} className="h-auto w-20" />
            </Link>
            <Dialog.Close aria-label="Schliessen" className="-mr-[15px] inline-flex h-12 items-center gap-2.5 rounded-full px-3 text-xs font-bold uppercase tracking-[0.16em] text-ink transition-opacity hover:opacity-70 active:opacity-70">
              <span className="translate-y-px">Schliessen</span>
              <X aria-hidden className="size-6" strokeWidth={2.25} />
            </Dialog.Close>
          </div>

          <nav aria-label="Hauptnavigation" className="shrink-0">
            {lagerHref ? (
              <div className="rounded-[1.25rem] bg-ink p-2 text-white">
                <Link
                  href={lagerHref}
                  aria-current={pathname === lagerHref ? "page" : undefined}
                  className={cn(
                    "flex min-h-[4.5rem] items-center gap-3 rounded-2xl px-3 py-2 hover:bg-white/5 active:bg-white/10 aria-[current=page]:bg-white/10 aria-[current=page]:ring-2 aria-[current=page]:ring-accent-light",
                    ON_NAVY_FOCUS
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold uppercase tracking-[0.18em] text-accent-light">
                      Aktuell
                    </span>
                    <span className="camp-display mt-1 block text-[1.75rem] leading-none">
                      Lager {aktuellesJahr}
                    </span>
                    {lagerZeitraum ? (
                      <span className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-white/80">
                        <CalendarDays aria-hidden className="size-4 shrink-0 text-accent-light" />
                        {lagerZeitraum}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight aria-hidden className="size-5 shrink-0 text-white/50" />
                </Link>
                <Link
                  href={`${lagerHref}#dokumente`}
                  className={cn(
                    "mt-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-accent-light text-base font-bold text-ink hover:bg-accent-light/90 active:bg-accent-light/80",
                    ON_NAVY_FOCUS
                  )}
                >
                  <FileText aria-hidden className="size-5" />
                  Dokumente
                </Link>
              </div>
            ) : null}

            <ul className="mt-2 divide-y divide-ink/[0.08]">
              {NAV.map(({ href, label, hint, Icon }) => {
                const inner = (
                  <>
                    <Icon aria-hidden className="size-6 shrink-0 text-ink/55" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-bold leading-snug">{label}</span>
                      <span className="block text-sm leading-snug text-muted">{hint}</span>
                    </span>
                    <ChevronRight aria-hidden className="size-5 shrink-0 text-ink/30" />
                  </>
                );
                return (
                  <li key={href}>
                    {href === "/fotos" ? (
                      // /fotos leitet serverseitig aufs externe Album um: normaler Seitenwechsel, gleicher Tab.
                      <a href={href} className={ROW}>
                        {inner}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        aria-current={isActive(href) ? "page" : undefined}
                        className={ROW}
                      >
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <nav
            aria-label="Weitere Links"
            className="mt-3 shrink-0 border-t border-ink/[0.08] pt-2 sm:mt-auto"
          >
            <ul className="-mx-2 flex flex-wrap gap-x-2">
              {meta.map(([href, label]) => (
                <li key={label}>
                  <Link
                    href={href}
                    aria-current={pathname === href ? "page" : undefined}
                    className={META}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              {isEditor ? (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className={cn(META, "w-full text-left")}
                  >
                    Abmelden
                  </button>
                </li>
              ) : null}
            </ul>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
