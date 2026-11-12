"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

export function SiteChrome({
  aktuellesJahr,
  lagerZeitraum,
  children,
}: {
  aktuellesJahr: number | null;
  lagerZeitraum: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const admin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (admin) return <main className="min-h-dvh bg-sand">{children}</main>;

  return (
    <>
      <SiteHeader aktuellesJahr={aktuellesJahr} lagerZeitraum={lagerZeitraum} />
      <main className="flex-1">{children}</main>
    </>
  );
}
