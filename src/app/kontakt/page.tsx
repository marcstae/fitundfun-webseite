import { cookies } from "next/headers";
import { Lock, Mail, Phone } from "lucide-react";
import { FamilyUnlock } from "@/components/family-unlock";
import { getKontaktgruppen, getKontakte, getSeite } from "@/lib/data";
import { FAMILY_ACCESS_COOKIE, hasFamilyAccess } from "@/lib/family-access";
import { unlockFamilyAccess } from "@/lib/familien-freischalten";
import { KONTAKT_EINLEITUNG, KONTAKT_TITEL, sichtbarerKontakt } from "@/lib/inhaltsseiten";
import { sanitizeRichText } from "@/lib/sanitize";

export const metadata = { title: "Kontakt" };

type Sichtbar = ReturnType<typeof sichtbarerKontakt>;

export default async function KontaktPage() {
  const [kontakte, gruppen, seite, cookieStore] = await Promise.all([
    getKontakte(),
    getKontaktgruppen(),
    getSeite("kontakt").catch(() => null),
    cookies(),
  ]);
  const zugang = await hasFamilyAccess(cookieStore.get(FAMILY_ACCESS_COOKIE)?.value);
  // Titel, Einleitung, Gruppen und Personen sind im Cockpit unter «Inhaltsseiten» bearbeitbar.
  const sichtbar = kontakte.map((k) => sichtbarerKontakt(k, zugang));
  const gesperrt = sichtbar.some((k) => k.emailGesperrt || k.telefonGesperrt);
  const ohneGruppe = sichtbar.filter((k) => !gruppen.some((g) => g.id === k.gruppe));
  const bloecke = [
    ...gruppen.map((g) => ({ id: g.id, titel: g.name, items: sichtbar.filter((k) => k.gruppe === g.id) })),
    { id: "weitere", titel: "Weitere Kontakte", items: ohneGruppe },
  ].filter((block) => block.items.length > 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <header className="max-w-3xl">
        <h1 className="camp-display text-4xl leading-none text-ink sm:text-6xl">
          {seite?.titel || KONTAKT_TITEL}
        </h1>
        <div
          className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-muted [&_a]:text-accent [&_a]:underline [&_p+p]:mt-3"
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(seite?.inhalt || KONTAKT_EINLEITUNG) }}
        />
      </header>

      {gesperrt ? (
        <div className="mt-8 flex flex-col gap-3 rounded-[1.5rem] bg-ink p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <p className="flex items-start gap-3 text-sm font-semibold leading-relaxed text-white/85">
            <Lock className="mt-0.5 size-5 shrink-0 text-accent-light" aria-hidden />
            Einige Telefonnummern und E-Mail-Adressen sind nur mit dem Lagerpasswort sichtbar.
          </p>
          <FamilyUnlock
            action={unlockFamilyAccess}
            href={null}
            locked
            nurFreischalten
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent-light px-5 font-bold text-ink transition hover:bg-white"
          >
            Lagerpasswort eingeben
          </FamilyUnlock>
        </div>
      ) : null}

      {bloecke.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2">
          {bloecke.map((block) => (
            <KontaktBlock key={block.id} titel={block.titel} items={block.items} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm font-semibold text-muted">Noch keine Kontaktpersonen eingetragen.</p>
      )}
    </div>
  );
}

function KontaktBlock({ titel, items }: { titel: string; items: Sichtbar[] }) {
  return (
    <section className="rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-7">
      <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted">{titel}</h2>
      <ul className="mt-4 space-y-6">
        {items.map((k) => (
          <li key={k.id}>
            <p className="camp-display text-2xl text-ink">{k.name}</p>
            {k.email || k.telefon ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {k.email ? (
                  <a
                    href={`mailto:${k.email}`}
                    className="inline-flex min-h-12 max-w-full items-center gap-2 rounded-xl bg-accent px-4 text-base font-bold text-white transition hover:bg-ink"
                  >
                    <Mail className="size-5 shrink-0" aria-hidden />
                    <span className="truncate">{k.email}</span>
                  </a>
                ) : null}
                {k.telefon ? (
                  <a
                    href={`tel:${k.telefon.replace(/[^\d+]/g, "")}`}
                    className="inline-flex min-h-12 max-w-full items-center gap-2 rounded-xl border border-ink/15 px-4 text-base font-bold text-ink transition hover:bg-sand"
                  >
                    <Phone className="size-5 shrink-0 text-accent" aria-hidden />
                    <span className="truncate">{k.telefon}</span>
                  </a>
                ) : null}
              </div>
            ) : null}
            {k.emailGesperrt || k.telefonGesperrt ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-muted">
                <Lock className="size-4 shrink-0" aria-hidden />
                {k.emailGesperrt && k.telefonGesperrt ? "E-Mail und Telefon" : k.emailGesperrt ? "E-Mail" : "Telefon"} nur mit
                Lagerpasswort
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
