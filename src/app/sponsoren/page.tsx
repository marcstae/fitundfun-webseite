import { getSponsoren } from "@/lib/data";
import { publicFileUrl } from "@/lib/pb";
import { SponsorenManager } from "@/components/edit/sponsoren-manager";

export const revalidate = 300;

export const metadata = { title: "Sponsoren" };

export default async function SponsorenPage() {
  const sponsoren = await getSponsoren();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h1 className="font-display text-3xl uppercase text-ink sm:text-4xl">Sponsoren</h1>
      <p className="mt-3 text-sm text-muted">
        Herzlichen Dank an alle, die das Lager über die Jahre unterstützt haben.
      </p>

      {sponsoren.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Noch keine Sponsoren erfasst.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sponsoren.map((s) => {
            const logo = s.logo ? publicFileUrl("sponsoren", s.id, s.logo) : null;
            const inner = (
              <div className="flex h-28 items-center justify-center rounded-2xl border border-ink/10 p-4">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt={s.name} className="max-h-16 w-auto opacity-80 grayscale" />
                ) : (
                  <span className="font-display text-lg text-ink">{s.name}</span>
                )}
              </div>
            );
            return (
              <li key={s.id}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="block transition hover:opacity-100">
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10">
        <SponsorenManager existing={sponsoren} />
      </div>
    </div>
  );
}
