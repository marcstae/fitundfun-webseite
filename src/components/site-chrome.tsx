"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function SiteChrome({
  aktuellesJahr,
  children,
}: {
  aktuellesJahr: number | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const admin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (admin) return <main className="min-h-dvh bg-sand">{children}</main>;

  return (
    <>
      <SiteHeader aktuellesJahr={aktuellesJahr} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
