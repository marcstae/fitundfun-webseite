import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  Download,
  ExternalLink,
  FileText,
  Images,
  KeyRound,
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
  FAMILY_ACCESS_COOKIE,
  FAMILY_ACCESS_MAX_AGE,
  familyAccessCookieValue,
  hasFamilyAccess,
  isFamilyPassword,
  recordUnlockFailure,
  unlockAttemptAllowed,
} from "@/lib/family-access";
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
  searchParams,
}: {
  params: Promise<{ jahr: string }>;
  searchParams?: Promise<{ familienzugang?: string }>;
}) {
  const { jahr: jahrParam } = await params;
  const jahr = Number(jahrParam);
  if (!jahr) notFound();

  const [lager, archiv] = await Promise.all([
    getLagerByJahr(jahr),
    getArchivByJahr(jahr),
  ]);
  if (!lager && !archiv) notFound();

  const cookieStore = await cookies();
  const authCookie = cookieStore.toString();
  const familyAccess = hasFamilyAccess(
    cookieStore.get(FAMILY_ACCESS_COOKIE)?.value
  );
  const search = await searchParams;
  const [documentResult, links] = await Promise.all([
    lager
      ? getDokumenteForLager(lager.id, authCookie, familyAccess)
      : getDokumenteForArchiv(archiv!.id, authCookie, familyAccess),
    getLinks(),
  ]);
  const dokumente = documentResult.items;

  const titel = lager?.titel || `Lager ${jahr}`;
  const datumVon = lager?.datum_von || archiv?.datum_von || "";
  const datumBis = lager?.datum_bis || archiv?.datum_bis || "";
  const zeitraum =
    datumVon && datumBis ? formatDateRangeLong(datumVon, datumBis) : `Lager ${jahr}`;
  const beschreibung = lager
    ? sanitizeRichText(lager.beschreibung || "")
    : archiv?.beschreibung || "";
  const fotosUrl = documentResult.fotoalbum?.url || "";
  const validFotosUrl = !!fotosUrl && isValidHttpUrl(fotosUrl);
  const videoUrl = lager?.youtube_url || archiv?.video_url || "";
  const validVideoUrl = !!videoUrl && isValidHttpUrl(videoUrl);
  const ytId = youtubeId(videoUrl);
  const teilnehmer = lager?.teilnehmer || archiv?.teilnehmer || null;
  const preise = lager?.preise || archiv?.preise || [];
  const aktivitaeten = lager?.aktivitaeten || archiv?.aktivitaeten || [];
  const mediaCollection = lager ? "lager" : "archiv";
  const mediaRecordId = lager?.id || archiv!.id;
  const showFamilyGate =
    !documentResult.accessGranted &&
    (documentResult.hasProtected || documentResult.hasProtectedPhoto);

  async function unlockFamilyAccess(formData: FormData) {
    "use server";
    const headerStore = await headers();
    const ip =
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!unlockAttemptAllowed(ip)) {
      redirect(`/lager/${jahr}?familienzugang=blockiert#familienzugang`);
    }

    const password = formData.get("password");
    if (typeof password !== "string" || !isFamilyPassword(password)) {
      recordUnlockFailure(ip);
      redirect(`/lager/${jahr}?familienzugang=fehler#familienzugang`);
    }

    const cookieStore2 = await cookies();
    cookieStore2.set(FAMILY_ACCESS_COOKIE, familyAccessCookieValue(), {
      httpOnly: true,
      maxAge: FAMILY_ACCESS_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: headerStore.get("x-forwarded-proto") === "https",
    });
    redirect(`/lager/${jahr}#dokumente`);
  }


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

        {showFamilyGate ? (
          <section
            id="familienzugang"
            className="scroll-mt-20 rounded-2xl border border-accent/25 bg-accent/[0.04] p-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 size-6 shrink-0 text-accent" />
              <div>
                <h2 className="font-display text-xl text-ink">
                  Familienzugang
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  Mit dem gemeinsamen Familienpasswort werden{" "}
                  {documentResult.hasProtectedPhoto
                    ? documentResult.hasProtected
                      ? "das Fotoalbum und die geschützten Lagerdokumente"
                      : "das Fotoalbum"
                    : "Zimmerplan, Teilnehmerliste und weitere geschützte Dateien"}{" "}
                  freigeschaltet.
                </p>
              </div>
            </div>
            <form
              action={unlockFamilyAccess}
              className="mt-5 flex max-w-lg flex-col gap-3 sm:flex-row"
            >
              <div className="flex-1">
                <label className="sr-only" htmlFor="family-password">
                  Familienpasswort
                </label>
                <input
                  id="family-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  aria-describedby={
                    search?.familienzugang === "fehler"
                      ? "family-password-error"
                      : undefined
                  }
                  className="h-11 w-full rounded-xl border border-ink/15 bg-white px-4 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="Familienpasswort"
                />
              </div>
              <button
                type="submit"
                className="h-11 rounded-xl bg-accent px-5 text-sm font-bold text-white transition hover:bg-accent/90"
              >
                Freischalten
              </button>
            </form>
            {search?.familienzugang === "fehler" ? (
              <p
                id="family-password-error"
                role="alert"
                className="mt-2 text-sm font-semibold text-red-700"
              >
                Das Familienpasswort ist nicht korrekt.
              </p>
            ) : search?.familienzugang === "blockiert" ? (
              <p role="alert" className="mt-2 text-sm font-semibold text-red-700">
                Zu viele Versuche — bitte in einer Stunde erneut versuchen.
              </p>
            ) : null}
            <p className="mt-3 text-xs text-muted">
              Dieser Zugang ist vom Admin-Login der Lagerleitung getrennt.
            </p>
          </section>
        ) : null}

        <section id="dokumente" className="scroll-mt-20">
          <h2 className="camp-display mb-5 text-2xl text-ink sm:text-3xl">
            Dokumente
          </h2>
          {dokumente.length === 0 ? (
            <p className="text-sm text-muted">Noch keine öffentlichen Dokumente vorhanden.</p>
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

        {validFotosUrl && documentResult.accessGranted ? (
          <section>
            <h2 className="camp-display mb-5 text-2xl text-ink sm:text-3xl">
              Fotos
            </h2>
            <a
              href={fotosUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-start gap-3 rounded-2xl border border-ink/10 p-6 transition hover:border-accent/40 hover:bg-accent/[0.03] sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex items-center gap-3">
                <Images className="size-7 text-accent" />
                <span className="font-display text-lg text-ink">
                  Fotos ansehen oder hochladen
                </span>
              </span>
              <span className="text-sm text-muted">
                Immich-Album in einem neuen Tab öffnen
              </span>
            </a>
            <div className="mt-3">
              <EditableImmich
                relation={mediaCollection}
                relationId={mediaRecordId}
                albumId={documentResult.fotoalbum?.id}
                current={fotosUrl}
              />
            </div>
          </section>
        ) : (
          <EditableImmich
            relation={mediaCollection}
            relationId={mediaRecordId}
            albumId={documentResult.fotoalbum?.id}
            current={fotosUrl}
          />
        )}

        {validVideoUrl ? (
          <section>
            <h2 className="camp-display mb-5 text-2xl text-ink sm:text-3xl">
              Video
            </h2>
            {ytId ? <YoutubeClickToPlay id={ytId} /> : null}
            {!ytId ? (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline"
              >
                Video öffnen <ExternalLink className="size-4" />
              </a>
            ) : null}
            <div className="mt-3">
              <EditableYoutube
                collection={mediaCollection}
                recordId={mediaRecordId}
                current={videoUrl}
              />
            </div>
          </section>
        ) : (
          <EditableYoutube
            collection={mediaCollection}
            recordId={mediaRecordId}
            current={videoUrl}
          />
        )}

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
            <span className="hidden shrink-0 text-xs text-muted sm:inline">Geschützt</span>
          ) : null}
        </span>
        <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-accent">
          <Download className="size-4" /> {fileType}
        </span>
      </a>
    </li>
  );
}
