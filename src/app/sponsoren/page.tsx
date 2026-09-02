import { getSponsoren } from "@/lib/data";
import { publicFileUrl } from "@/lib/pb";

export const revalidate = 300;

export const metadata = { title: "Sponsoren" };

export default async function SponsorenPage() {
  const sponsoren = await getSponsoren();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Gemeinsam möglich
        </p>
        <h1 className="camp-display mt-4 text-4xl leading-none text-ink sm:text-6xl">
          Sponsoren
        </h1>
        <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-muted">
          Herzlichen Dank an alle, die das Lager über die Jahre unterstützt haben.
        </p>
      </header>

      {sponsoren.length === 0 ? (
        <p className="mt-10 rounded-[1.75rem] border border-ink/10 bg-white p-6 text-sm font-semibold text-muted sm:p-7">
          Noch keine Sponsoren erfasst.
        </p>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sponsoren.map((s) => {
            const logo = s.logo ? publicFileUrl("sponsoren", s.id, s.logo) : null;
            const inner = (
              <div className="flex h-40 items-center justify-center rounded-[1.75rem] border border-ink/10 bg-white p-6 transition group-hover:-translate-y-1 group-hover:border-ink/20 group-hover:shadow-[0_18px_45px_rgba(14,28,48,0.08)]">
                {logo ? (
                  <img src={logo} alt={s.name} className="max-h-20 w-auto max-w-full" />
                ) : (
                  <span className="camp-display text-2xl text-ink">{s.name}</span>
                )}
              </div>
            );
            return (
              <li key={s.id}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="group block">
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

    </div>
  );
}
