import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Download,
  FileText,
  Images,
  Lock,
  ExternalLink,
} from "lucide-react";
import {
  getDokumenteForLager,
  getLagerByJahr,
  getLinks,
  getLager,
} from "@/lib/data";
import {
  formatDateRangeLong,
  youtubeId,
  isValidHttpUrl,
} from "@/lib/utils";
import { sanitizeRichText } from "@/lib/sanitize";
import { YoutubeClickToPlay } from "@/components/youtube-click-to-play";
import { EditableLagerDaten } from "@/components/edit/editable-lager";
import { EditableDokumentList } from "@/components/edit/editable-dokument-list";
import { EditableYoutube } from "@/components/edit/editable-youtube";
import { EditableImmich } from "@/components/edit/editable-immich";
import { EditableLinks } from "@/components/edit/editable-links";

export const revalidate = 300;

export async function generateStaticParams() {
  const lager = await getLager();
  return lager.map((l) => ({ jahr: String(l.jahr) }));
}

export default async function LagerPage({
  params,
}: {
  params: { jahr: string };
}) {
  const jahr = Number(params.jahr);
  if (!jahr) notFound();

  const lager = await getLagerByJahr(jahr);
  if (!lager) notFound();

  const [dokumente, links] = await Promise.all([
    getDokumenteForLager(lager.id),
    getLinks(),
  ]);

  const ytId = youtubeId(lager.youtube_url || "");
  const beschreibung = sanitizeRichText(lager.beschreibung || "");

  return (
    <article>
      {/* Kopf */}
      <header className="border-b border-ink/8 bg-navy-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-wider text-accent-light/80 mb-2">
            {formatDateRangeLong(lager.datum_von, lager.datum_bis)}
          </p>
          <h1 className="font-display text-4xl uppercase leading-tight sm:text-5xl">
            {lager.titel || `Lager ${lager.jahr}`}
          </h1>
          {beschreibung && (
            <div
              className="prose prose-invert mt-4 max-w-2xl text-white/85 [&_a]:text-accent-light [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: beschreibung }}
            />
          )}
          <div className="mt-4">
            <EditableLagerDaten lager={lager} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-14 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* DOKUMENTE */}
        <section id="dokumente" className="scroll-mt-20">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl uppercase text-ink sm:text-3xl">
              Dokumente
            </h2>
          </div>
          {dokumente.length === 0 ? (
            <p className="text-sm text-muted">Noch keine Dokumente vorhanden.</p>
          ) : (
            <ul className="divide-y divide-ink/8 rounded-2xl border border-ink/10">
              {dokumente.map((d) => (
                <DocumentRow key={d.id} doc={d} lagerId={lager.id} />
              ))}
            </ul>
          )}
          <div className="mt-4">
            <EditableDokumentList lagerId={lager.id} existing={dokumente} />
          </div>
        </section>

        {/* FOTOS */}
        <section>
          <h2 className="mb-5 font-display text-2xl uppercase text-ink sm:text-3xl">
            Fotos
          </h2>
          {lager.immich_url && isValidHttpUrl(lager.immich_url) ? (
            <a
              href={lager.immich_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-start gap-3 rounded-2xl border border-ink/10 p-6 transition hover:border-accent/40 hover:bg-accent/[0.03] sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex items-center gap-3">
                <Images className="size-7 text-accent" />
                <span className="font-display text-lg text-ink">Fotos ansehen</span>
              </span>
              <span className="text-sm text-muted">
                Hier kannst du auch deine eigenen Fotos hochladen.
              </span>
            </a>
          ) : (
            <p className="text-sm text-muted">Noch kein Foto-Album verlinkt.</p>
          )}
          <div className="mt-3">
            <EditableImmich lagerId={lager.id} current={lager.immich_url} />
          </div>
        </section>

        {/* VIDEO */}
        <section>
          <h2 className="mb-5 font-display text-2xl uppercase text-ink sm:text-3xl">
            Video
          </h2>
          {ytId ? (
            <YoutubeClickToPlay id={ytId} />
          ) : (
            <p className="text-sm text-muted">Noch kein Video verlinkt.</p>
          )}
          <div className="mt-3">
            <EditableYoutube lagerId={lager.id} current={lager.youtube_url} />
          </div>
        </section>

        {/* LINKS */}
        {links.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-lg uppercase text-ink">Nützliche Links</h2>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {links.map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                >
                  {l.titel} <ExternalLink className="size-3.5" />
                </a>
              ))}
            </div>
            <div className="mt-3">
              <EditableLinks />
            </div>
          </section>
        )}
        {links.length === 0 && (
          <section>
            <div className="mt-3">
              <EditableLinks />
            </div>
          </section>
        )}

        <div className="pt-4">
          <Link
            href="/lager"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
          >
            ← Zurück zum Archiv
          </Link>
        </div>
      </div>
    </article>
  );
}

function DocumentRow({
  doc,
  lagerId,
}: {
  doc: import("@/lib/pb-types").DokumentRecord;
  lagerId: string;
}) {
  if (doc.sensibel) {
    return (
      <li className="flex items-center justify-between gap-4 p-4 sm:p-5">
        <span className="flex items-center gap-3 text-ink/70">
          <Lock className="size-5 text-muted" />
          <span className="font-semibold">{doc.name}</span>
          <span className="text-xs text-muted">Passwort bei der Lagerleitung</span>
        </span>
        <Link
          href={`/login?redirect=/lager/${lagerId}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink/15 px-3 text-xs font-bold text-ink hover:bg-ink/5"
        >
          Anmelden
        </Link>
      </li>
    );
  }
  const href = `/api/download/dokumente/${doc.id}/${encodeURIComponent(doc.datei)}`;
  return (
    <li>
      <a
        href={href}
        className="flex items-center justify-between gap-4 p-4 transition hover:bg-ink/[0.02] sm:p-5"
      >
        <span className="flex items-center gap-3">
          <FileText className="size-5 text-accent" />
          <span className="font-semibold text-ink">{doc.name}</span>
        </span>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-accent">
          <Download className="size-4" /> PDF
        </span>
      </a>
    </li>
  );
}

