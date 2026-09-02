import { EditableLinks } from "@/components/edit/editable-links";
import { KontakteManager } from "@/components/edit/kontakte-manager";
import { SponsorenManager } from "@/components/edit/sponsoren-manager";
import { getKontakte, getSponsoren } from "@/lib/data";

export default async function AdminOrganisationPage() {
  const [sponsoren, kontakte] = await Promise.all([getSponsoren(), getKontakte()]);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Verwaltung</p>
      <h1 className="camp-display mt-2 text-4xl text-ink sm:text-5xl">Organisation</h1>
      <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-muted">
        Sponsoren, Kontaktpersonen und externe Links zentral pflegen.
      </p>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-[1.75rem] border border-ink/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl text-ink">Sponsoren</h2>
          <p className="mt-2 text-sm font-semibold text-muted">Name, Website und Logo verwalten.</p>
          <div className="mt-6"><SponsorenManager existing={sponsoren} /></div>
        </section>

        <section className="rounded-[1.75rem] border border-ink/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl text-ink">Kontakte</h2>
          <p className="mt-2 text-sm font-semibold text-muted">Ansprechpersonen für Lager und Website.</p>
          <div className="mt-6"><KontakteManager existing={kontakte} /></div>
        </section>

        <section className="rounded-[1.75rem] border border-ink/10 bg-white p-6 sm:p-8 xl:col-span-2">
          <h2 className="font-display text-2xl text-ink">Nützliche Links</h2>
          <p className="mt-2 text-sm font-semibold text-muted">Links, die auf den Lagerseiten angezeigt werden.</p>
          <div className="mt-6"><EditableLinks /></div>
        </section>
      </div>
    </div>
  );
}
