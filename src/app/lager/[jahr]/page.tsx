import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  Download,
  ExternalLink,
  FileText,
  Images,
  Lock,
  UsersRound,
} from "lucide-react";
import {
  getArchivByJahr,
  getDokumenteForArchiv,
  getDokumenteForLager,
  getLagerByJahr,
  getLinks,
} from "@/lib/data";
import {
  formatDateRangeLong,
  isValidHttpUrl,
  youtubeId,
} from "@/lib/utils";
import { sanitizeRichText } from "@/lib/sanitize";
import type { DokumentRecord } from "@/lib/pb-types";
import { YoutubeClickToPlay } from "@/components/youtube-click-to-play";
import { EditableLagerDaten } from "@/components/edit/editable-lager";
import { EditableDokumentList } from "@/components/edit/editable-dokument-list";
import { EditableYoutube } from "@/components/edit/editable-youtube";
import { EditableImmich } from "@/components/edit/editable-immich";
import { EditableLinks } from "@/components/edit/editable-links";

export const dynamic = "force-dynamic";

export default async function LagerPage({
  params,
}: {
  params: { jahr: string };
}) {
  const jahr = Number(params.jahr);
  if (!jahr) notFound();

  const [lager, archiv] = await Promise.all([
    getLagerByJahr(jahr),
    getArchivByJahr(jahr),
  ]);
  if (!lager && !archiv) notFound();

  const authCookie = cookies().toString();
  const [dokumente, links] = await Promise.all([
    lager
      ? getDokumenteForLager(lager.id, authCookie)
      : getDokumenteForArchiv(archiv!.id, authCookie),
    getLinks(),
  ]);

  const titel = lager?.titel || `Lager ${jahr}`;
  const datumVon = lager?.datum_von || archiv?.datum_von || "";
  const datumBis = lager?.datum_bis || archiv?.datum_bis || "";
  const zeitraum =
    datumVon && datumBis ? formatDateRangeLong(datumVon, datumBis) : `Lager ${jahr}`;
  const beschreibung = lager
    ? sanitizeRichText(lager.beschreibung || "")
    : archiv?.beschreibung || "";
  const fotosUrl = lager?.immich_url || archiv?.fotos_url || "";
  const videoUrl = lager?.youtube_url || archiv?.video_url || "";
  const ytId = youtubeId(videoUrl);
  const teilnehmer = lager?.teilnehmer || archiv?.teilnehmer || null;
  const preise = lager?.preise || archiv?.preise || [];
  const aktivitaeten = lager?.aktivitaeten || archiv?.aktivitaeten || [];

  return (
    <article>
      <header className="border-b border-ink/8 bg-navy-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-accent-light/80">
            {zeitraum}
          </p>
          <h1 className="camp-display text-4xl leading-tight sm:text-5xl">
            {titel}
          </h1>
          {lager && beschreibung ? (
            <div
              className="prose prose-invert mt-4 max-w-2xl text-white/85 [&_a]:text-accent-light [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: beschreibung }}
            />
          ) : null}
          {!lager && beschreibung ? (
            <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-white/80">
              {beschreibung}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            {teilnehmer ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                <UsersRound className="size-4 text-accent-light" />
                {teilnehmer} Teilnehmende
              </span>
            ) : null}
            {preise.slice(0, 2).map((preis) => (
              <span
                key={`${preis.label}-${preis.preis}`}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold"
              >
                {preis.label}: {preis.preis}
              </span>
            ))}
          </div>

          {lager ? (
            <div className="mt-4">
              <EditableLagerDaten lager={lager} />
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-14 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {aktivitaeten.length > 0 ? (
          <section>
            <h2 className="camp-display mb-5 text-2xl text-ink sm:text-3xl">
              Was dabei war
            </h2>
            <div className="flex flex-wrap gap-2">
              {aktivitaeten.map((aktivitaet) => (
                <span
                  key={aktivitaet}
                  className="rounded-full border border-ink/10 bg-navy-50 px-3 py-1.5 text-sm font-semibold text-ink"
                >
                  {aktivitaet}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section id="dokumente" className="scroll-mt-20">
          <h2 className="camp-display mb-5 text-2xl text-ink sm:text-3xl">
            Dokumente
          </h2>
          {dokumente.length === 0 ? (
            <p className="text-sm text-muted">Noch keine Dokumente vorhanden.</p>
          ) : (
            <ul className="divide-y divide-ink/8 rounded-2xl border border-ink/10">
              {dokumente.map((document) => (
                <DocumentRow key={document.id} doc={document} />
              ))}
            </ul>
          )}
          {lager ? (
            <div className="mt-4">
              <EditableDokumentList lagerId={lager.id} existing={dokumente} />
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="camp-display mb-5 text-2xl text-ink sm:text-3xl">
            Fotos
          </h2>
          {fotosUrl && isValidHttpUrl(fotosUrl) ? (
            <a
              href={fotosUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-start gap-3 rounded-2xl border border-ink/10 p-6 transition hover:border-accent/40 hover:bg-accent/[0.03] sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex items-center gap-3">
                <Images className="size-7 text-accent" />
                <span className="font-display text-lg text-ink">Fotos ansehen</span>
              </span>
              <span className="text-sm text-muted">Foto-Album in einem neuen Tab öffnen</span>
            </a>
          ) : (
            <p className="text-sm text-muted">Noch kein Foto-Album verlinkt.</p>
          )}
          {lager ? (
            <div className="mt-3">
              <EditableImmich lagerId={lager.id} current={lager.immich_url} />
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="camp-display mb-5 text-2xl text-ink sm:text-3xl">
            Video
          </h2>
          {ytId ? <YoutubeClickToPlay id={ytId} /> : null}
          {!ytId && videoUrl && isValidHttpUrl(videoUrl) ? (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline"
            >
              Video öffnen <ExternalLink className="size-4" />
            </a>
          ) : null}
          {!videoUrl ? <p className="text-sm text-muted">Noch kein Video verlinkt.</p> : null}
          {lager ? (
            <div className="mt-3">
              <EditableYoutube lagerId={lager.id} current={lager.youtube_url} />
            </div>
          ) : null}
        </section>

        {archiv?.quelle_url ? (
          <section className="rounded-2xl bg-navy-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Historische Quelle
            </p>
            <a
              href={archiv.quelle_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
            >
              Ursprüngliche Lagerseite öffnen <ExternalLink className="size-3.5" />
            </a>
          </section>
        ) : null}

        {links.length > 0 ? (
          <section>
            <h2 className="mb-4 font-display text-lg uppercase text-ink">Nützliche Links</h2>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                >
                  {link.titel} <ExternalLink className="size-3.5" />
                </a>
              ))}
            </div>
            {lager ? (
              <div className="mt-3">
                <EditableLinks />
              </div>
            ) : null}
          </section>
        ) : lager ? (
          <section>
            <EditableLinks />
          </section>
        ) : null}

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

function DocumentRow({ doc }: { doc: DokumentRecord }) {
  const href = `/api/download/${doc.collection}/${doc.id}/${encodeURIComponent(doc.datei)}`;
  const fileType = doc.datei.toLowerCase().endsWith(".docx") ? "DOCX" : "PDF";

  return (
    <li>
      <a
        href={href}
        className="flex items-center justify-between gap-4 p-4 transition hover:bg-ink/[0.02] sm:p-5"
      >
        <span className="flex min-w-0 items-center gap-3">
          {doc.sensibel ? (
            <Lock className="size-5 shrink-0 text-muted" />
          ) : (
            <FileText className="size-5 shrink-0 text-accent" />
          )}
          <span className="truncate font-semibold text-ink">{doc.name}</span>
          {doc.sensibel ? (
            <span className="hidden shrink-0 text-xs text-muted sm:inline">Intern</span>
          ) : null}
        </span>
        <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-accent">
          <Download className="size-4" /> {fileType}
        </span>
      </a>
    </li>
  );
}
