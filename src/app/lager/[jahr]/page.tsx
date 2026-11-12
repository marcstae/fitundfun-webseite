import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Images,
  Lock,
  UsersRound,
} from "lucide-react";
import {
  getDokumenteForLager,
  getLagerByJahr,
  getLinks,
} from "@/lib/data";
import {
  FAMILY_ACCESS_COOKIE,
  FAMILY_ACCESS_MAX_AGE,
  clientIp,
  familyAccessCookieValue,
  hasFamilyAccess,
  isFamilyPassword,
  recordUnlockFailure,
  unlockAttemptAllowed,
} from "@/lib/family-access";
import {
  documentHref,
  formatDateRangeLong,
  isValidHttpUrl,
  youtubeId,
} from "@/lib/utils";
import { richTextToPlainText, sanitizeRichText } from "@/lib/sanitize";
import type { DokumentRecord } from "@/lib/pb-types";
import { YoutubeClickToPlay } from "@/components/youtube-click-to-play";
import { FamilyUnlock, type UnlockAction, type UnlockState } from "@/components/family-unlock";

export const dynamic = "force-dynamic";

// Nur Links auf geschützte Dokumente dürfen nach dem Freischalten das Ziel sein.
const WEITER = /^\/api\/download\/dokumente_intern\/[a-z0-9]+\/[^/?#]+$/;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jahr: string }>;
}) {
  const { jahr: jahrParam } = await params;
  const jahr = Number(jahrParam);
  const lager = await getLagerByJahr(jahr).catch(() => null);
  const titel = lager?.titel || `Lager ${jahr}`;
  const beschreibung =
    richTextToPlainText(lager?.beschreibung || "").slice(0, 160) ||
    `Informationen und Dokumente zum fit&fun Lager ${jahr} in Brigels.`;
  return {
    title: titel,
    description: beschreibung,
  };
}

export default async function LagerPage({
  params,
  searchParams,
}: {
  params: Promise<{ jahr: string }>;
  searchParams?: Promise<{
    fotos?: string;
    vorschau?: string;
    weiter?: string;
  }>;
}) {
  const { jahr: jahrParam } = await params;
  const jahr = Number(jahrParam);
  if (!jahr) notFound();

  const cookieStore = await cookies();
  const authCookie = cookieStore.toString();
  const search = await searchParams;
  const lager = await getLagerByJahr(
    jahr,
    search?.vorschau === "1" ? authCookie : ""
  );
  if (!lager) notFound();
  if (lager.status === "entwurf" && search?.vorschau !== "1") notFound();

  const familyAccess = await hasFamilyAccess(
    cookieStore.get(FAMILY_ACCESS_COOKIE)?.value
  );
  const [documentResult, links] = await Promise.all([
    getDokumenteForLager(lager.id, authCookie, familyAccess),
    getLinks(),
  ]);
  const dokumente = documentResult.items;

  const zeitraum =
    lager.datum_von && lager.datum_bis
      ? formatDateRangeLong(lager.datum_von, lager.datum_bis)
      : `Lager ${jahr}`;
  const beschreibung = sanitizeRichText(lager.beschreibung || "");
  const aktivitaeten = lager.aktivitaeten || [];
  const fotosUrl = documentResult.fotoalbum?.url || "";
  const validFotosUrl = !!fotosUrl && isValidHttpUrl(fotosUrl);
  const validVideoUrl = !!lager.youtube_url && isValidHttpUrl(lager.youtube_url);
  const ytId = youtubeId(lager.youtube_url);

  const locked = !documentResult.accessGranted;
  const weiter = search?.weiter && WEITER.test(search.weiter) ? search.weiter : "";
  const weiterId = weiter.split("/")[4] || "";
  const vonFotos = search?.fotos === "1";

  // Passwortabfrage erst beim ersten geschützten Download (oder Fotoalbum). Danach bleibt
  // der Zugang per Cookie auf dem Gerät gespeichert; das Fenster bietet den Link im neuen Tab an.
  async function unlockFamilyAccess(_state: UnlockState, formData: FormData): Promise<UnlockState> {
    "use server";
    const headerStore = await headers();
    const ip = clientIp(headerStore);
    if (!unlockAttemptAllowed(ip)) return { fehler: "blockiert" };

    const password = formData.get("password");
    if (typeof password !== "string" || !(await isFamilyPassword(password))) {
      recordUnlockFailure(ip);
      return { fehler: "falsch" };
    }

    (await cookies()).set(FAMILY_ACCESS_COOKIE, await familyAccessCookieValue(), {
      httpOnly: true,
      maxAge: FAMILY_ACCESS_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: headerStore.get("x-forwarded-proto") === "https",
    });
    return { ok: true };
  }

  return (
    <article className="bg-sand">
      {lager.status === "entwurf" ? (
        <div className="bg-amber-300 px-4 py-2 text-center text-sm font-bold text-ink">
          Entwurfsvorschau – dieses Lager ist noch nicht öffentlich.
        </div>
      ) : null}
      <header className="bg-ink text-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-light">
            {zeitraum}
          </p>
          <h1 className="camp-display mt-3 text-3xl leading-none sm:text-5xl">
            {lager.titel || `Lager ${jahr}`}
          </h1>
          {lager.teilnehmer ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
              <UsersRound className="size-4 text-accent-light" aria-hidden />
              {lager.teilnehmer} Teilnehmende
            </p>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-8 sm:space-y-14 sm:px-6 sm:py-14 lg:px-8">
        <section id="dokumente" aria-labelledby="dokumente-titel" className="scroll-mt-20">
          <h2 id="dokumente-titel" className="camp-display mb-4 text-2xl text-ink sm:mb-5 sm:text-3xl">
            Dokumente
          </h2>

          {dokumente.length === 0 ? (
            <p className="text-sm text-muted">Noch keine Dokumente vorhanden.</p>
          ) : (
            <ul className="divide-y divide-ink/8 overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white">
              {dokumente.map((document) => (
                <DocumentRow
                  key={document.id}
                  doc={document}
                  unlock={document.sensibel ? unlockFamilyAccess : null}
                  locked={locked}
                  autoOpen={document.id === weiterId}
                />
              ))}
            </ul>
          )}

        </section>

        {beschreibung ? (
          <section aria-labelledby="infos-titel">
            <h2 id="infos-titel" className="camp-display mb-4 text-2xl text-ink sm:mb-5 sm:text-3xl">
              Infos
            </h2>
            <div
              className="rounded-[1.5rem] bg-white p-5 wrap-break-word text-base leading-relaxed text-ink/80 sm:p-6 [&_a]:text-accent [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-4 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: beschreibung }}
            />
          </section>
        ) : null}

        {aktivitaeten.length > 0 ? (
          <section aria-labelledby="aktivitaeten-titel">
            <h2 id="aktivitaeten-titel" className="camp-display mb-4 text-2xl text-ink sm:mb-5 sm:text-3xl">
              Aktivitäten
            </h2>
            <ul className="flex flex-wrap gap-2">
              {aktivitaeten.map((aktivitaet) => (
                <li
                  key={aktivitaet}
                  className="rounded-full border border-ink/10 bg-white px-3 py-1.5 text-sm font-semibold text-ink"
                >
                  {aktivitaet}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {(validFotosUrl && !locked) || (documentResult.hasProtectedPhoto && locked) ? (
          <section id="fotos" aria-labelledby="fotos-titel" className="scroll-mt-20">
            <h2 id="fotos-titel" className="camp-display mb-4 text-2xl text-ink sm:mb-5 sm:text-3xl">
              Fotos
            </h2>
            <FamilyUnlock
              action={unlockFamilyAccess}
              href={validFotosUrl ? fotosUrl : null}
              locked={locked}
              autoOpen={vonFotos}
              className={PHOTO_CARD}
            >
              <PhotoCardContent />
            </FamilyUnlock>
          </section>
        ) : null}

        {validVideoUrl ? (
          <section aria-labelledby="video-titel">
            <h2 id="video-titel" className="camp-display mb-4 text-2xl text-ink sm:mb-5 sm:text-3xl">
              Video
            </h2>
            {ytId ? (
              <YoutubeClickToPlay id={ytId} />
            ) : (
              <a
                href={lager.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-accent hover:underline"
              >
                Video öffnen <ExternalLink className="size-4" aria-hidden />
              </a>
            )}
          </section>
        ) : null}

        {lager.quelle_url && isValidHttpUrl(lager.quelle_url) ? (
          <section className="rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Alte Lagerseite
            </p>
            <a
              href={lager.quelle_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-accent hover:underline"
            >
              Fotos und Berichte auf der früheren Website <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </section>
        ) : null}

        {links.length > 0 ? (
          <section aria-labelledby="links-titel" className="rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-6">
            <h2 id="links-titel" className="camp-display mb-2 text-2xl text-ink">Nützliche Links</h2>
            <ul className="flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-6">
              {links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                  >
                    {link.titel} <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Link
          href="/lager"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-accent hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden /> Alle Lager
        </Link>
      </div>
    </article>
  );
}

const ROW =
  "flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-accent/[0.04] active:bg-accent/[0.06] sm:px-5";
const PHOTO_CARD =
  "flex w-full items-center gap-4 rounded-[1.5rem] border border-ink/10 bg-white p-5 text-left transition hover:border-ink/20 sm:p-6";

function PhotoCardContent() {
  return (
    <>
      <Images className="size-7 shrink-0 text-accent" aria-hidden />
      <span className="min-w-0">
        <span className="block font-display text-lg text-ink">Fotos ansehen oder hochladen</span>
        <span className="block text-sm text-muted">Fotoalbum öffnet in einem neuen Tab</span>
      </span>
    </>
  );
}

function DocumentRow({
  doc,
  unlock,
  locked,
  autoOpen,
}: {
  doc: DokumentRecord;
  unlock: UnlockAction | null;
  locked: boolean;
  autoOpen: boolean;
}) {
  const fileType = doc.datei.toLowerCase().endsWith(".docx") ? "Word" : "PDF";
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        {doc.sensibel ? (
          <Lock className="size-5 shrink-0 text-muted" aria-label="Passwortgeschützt" />
        ) : (
          <FileText className="size-5 shrink-0 text-accent" aria-hidden />
        )}
        <span className="min-w-0 font-semibold leading-snug text-ink">{doc.name}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-accent">
        <Download className="size-4" aria-hidden />
        {fileType}
      </span>
    </>
  );

  return (
    <li>
      {unlock ? (
        // Geschützt: immer dieselbe Komponente, damit das Passwortfenster das Neuladen übersteht.
        <FamilyUnlock action={unlock} href={documentHref(doc)} locked={locked} autoOpen={autoOpen} className={ROW}>
          {content}
        </FamilyUnlock>
      ) : (
        <a href={documentHref(doc)} target="_blank" rel="noopener noreferrer" className={ROW}>
          {content}
        </a>
      )}
    </li>
  );
}
