import Link from "next/link";
import { getKontakte } from "@/lib/data";

export const revalidate = 300;

export const metadata = { title: "Kontakt" };

export default async function KontaktPage() {
  const kontakte = await getKontakte();
  const lagerleiter = kontakte.filter((k) => k.rolle === "Lagerleiter");
  const website = kontakte.filter((k) => k.rolle === "Website");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Persönlich erreichbar
        </p>
        <h1 className="camp-display mt-4 text-4xl leading-none text-ink sm:text-6xl">
          Kontakt
        </h1>
        <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-muted">
          Fragen zum Lager oder zur Website beantworten wir persönlich.
        </p>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <KontaktBlock titel="Lagerleitung" items={lagerleiter} />
        {website.length > 0 ? <KontaktBlock titel="Website" items={website} /> : null}
      </div>

      <div className="mt-8">
        <Link href="/" className="text-sm font-bold text-accent hover:underline">
          ← Zur Startseite
        </Link>
      </div>
    </div>
  );
}

function KontaktBlock({
  titel,
  items,
}: {
  titel: string;
  items: { id: string; name: string }[];
}) {
  return (
    <section className="min-h-52 rounded-[1.75rem] border border-ink/10 bg-white p-6 sm:p-7">
      <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted">{titel}</h2>
      {items.length === 0 ? (
        <p className="mt-6 text-sm font-semibold text-muted/70">Noch niemand eingetragen.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((k) => (
            <li key={k.id} className="camp-display text-2xl text-ink">{k.name}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
