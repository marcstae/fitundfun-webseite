import { Mail } from "lucide-react";
import { getKontakte } from "@/lib/data";
import type { KontaktRecord } from "@/lib/pb-types";

export const revalidate = 300;

export const metadata = { title: "Kontakt" };

export default async function KontaktPage() {
  const kontakte = await getKontakte();
  const lagerleitung = kontakte.filter((k) => k.rolle === "Lagerleiter");
  const website = kontakte.filter((k) => k.rolle === "Website");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <header className="max-w-3xl">
        <h1 className="camp-display text-4xl leading-none text-ink sm:text-6xl">
          Kontakt
        </h1>
        <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-muted">
          Fragen zum Lager oder zur Website beantworten wir gerne per E-Mail.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2">
        <KontaktBlock titel="Lagerleitung" items={lagerleitung} />
        {website.length > 0 ? <KontaktBlock titel="Website" items={website} /> : null}
      </div>
    </div>
  );
}

function KontaktBlock({ titel, items }: { titel: string; items: KontaktRecord[] }) {
  return (
    <section className="rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-7">
      <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted">{titel}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm font-semibold text-muted">Noch niemand eingetragen.</p>
      ) : (
        <ul className="mt-4 space-y-5">
          {items.map((k) => (
            <li key={k.id}>
              <p className="camp-display text-2xl text-ink">{k.name}</p>
              {k.email ? (
                <a
                  href={`mailto:${k.email}`}
                  className="mt-2 inline-flex min-h-12 max-w-full items-center gap-2 rounded-xl bg-accent px-4 text-base font-bold text-white transition hover:bg-ink"
                >
                  <Mail className="size-5 shrink-0" aria-hidden />
                  <span className="truncate">{k.email}</span>
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
