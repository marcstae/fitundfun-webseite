import Link from "next/link";
import { getKontakte } from "@/lib/data";
import { KontakteManager } from "@/components/edit/kontakte-manager";

export const revalidate = 300;

export const metadata = { title: "Kontakt" };

export default async function KontaktPage() {
  const kontakte = await getKontakte();
  const lagerleiter = kontakte.filter((k) => k.rolle === "Lagerleiter");
  const website = kontakte.filter((k) => k.rolle === "Website");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h1 className="font-display text-3xl uppercase text-ink sm:text-4xl">Kontakt</h1>
      <p className="mt-3 text-sm text-muted">
        Der Kontakt läuft persönlich über die Familie und Freunde 🙂
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <KontaktBlock titel="Lagerleitung" items={lagerleiter} />
        <KontaktBlock titel="Website" items={website} />
      </div>

      <div className="mt-10">
        <KontakteManager existing={kontakte} />
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
    <div>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{titel}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted/70">—</p>
      ) : (
        <ul className="space-y-1">
          {items.map((k) => (
            <li key={k.id} className="text-base font-semibold text-ink">{k.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
