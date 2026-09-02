import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { HeroSettings } from "@/components/admin/hero-settings";
import { EditableSeite } from "@/components/edit/editable-seite";
import { getEinstellungen, getSeite } from "@/lib/data";

const pages = [
  { slug: "lagerhaus", title: "Lagerhaus", href: "/lagerhaus" },
  { slug: "impressum", title: "Impressum", href: "/impressum" },
  { slug: "datenschutz", title: "Datenschutz", href: "/datenschutz" },
] as const;

export default async function AdminWebsitePage() {
  const [settings, ...content] = await Promise.all([
    getEinstellungen(),
    ...pages.map((page) => getSeite(page.slug)),
  ]);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Inhalte</p>
      <h1 className="camp-display mt-2 text-4xl text-ink sm:text-5xl">Website</h1>
      <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-muted">
        Globale Inhalte bearbeiten, die nicht zu einem einzelnen Lager gehören.
      </p>

      <div className="mt-8 space-y-6">
        <HeroSettings initial={settings} />

        <section className="rounded-[1.75rem] border border-ink/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl text-ink">Inhaltsseiten</h2>
          <p className="mt-2 text-sm font-semibold text-muted">Texte und Überschriften der statischen Seiten.</p>
          <ul className="mt-6 divide-y divide-ink/8 overflow-hidden rounded-2xl border border-ink/10">
            {pages.map((page, index) => (
              <li key={page.slug} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-ink">{page.title}</h3>
                  <Link href={page.href} target="_blank" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline">
                    Seite ansehen <ExternalLink className="size-3" />
                  </Link>
                </div>
                <EditableSeite slug={page.slug} seite={content[index]} defaultTitel={page.title} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
