"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  Files,
  Globe,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "@/components/providers";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Übersicht", icon: LayoutDashboard, exact: true },
  { href: "/admin/lager", label: "Lager", icon: CalendarDays },
  { href: "/admin/inhaltsseiten", label: "Inhaltsseiten", icon: Files },
  { href: "/admin/website", label: "Website", icon: Globe },
  { href: "/admin/konto", label: "Konto", icon: Settings },
];

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const signOut = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="min-h-dvh bg-sand lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b border-white/10 bg-navy-900 pt-[env(safe-area-inset-top)] text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:block lg:px-6 lg:py-7">
          <Link href="/admin" className="whitespace-nowrap font-display text-lg uppercase tracking-tight sm:text-xl">
            fit<span className="text-accent-light">&amp;</span>fun Admin
          </Link>
          <div className="flex items-center gap-1 lg:mt-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap px-2 text-xs font-bold text-white/65 hover:text-white"
            >
              Website <span className="hidden sm:inline">ansehen</span> <ExternalLink className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={signOut}
              data-leave-guard
              className="inline-flex size-11 items-center justify-center rounded-lg text-white/65 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Abmelden"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>

        <nav className="flex flex-wrap gap-1 px-3 pb-3 lg:flex-col lg:flex-nowrap lg:px-4 lg:py-2" aria-label="Admin-Navigation">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold transition lg:w-full",
                  active
                    ? "bg-white text-ink"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="size-4" /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-white/10 p-4 lg:mt-auto lg:block">
          <p className="truncate px-2 text-xs text-white/50">{email}</p>
          <button
            type="button"
            onClick={signOut}
            data-leave-guard
            className="mt-2 inline-flex h-10 w-full items-center gap-2 rounded-xl px-2 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" /> Abmelden
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-10 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
