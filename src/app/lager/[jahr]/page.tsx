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
  formatDateRangeLong,
  isValidHttpUrl,
  youtubeId,
} from "@/lib/utils";
import { richTextToPlainText, sanitizeRichText } from "@/lib/sanitize";
import type { DokumentRecord } from "@/lib/pb-types";
import { YoutubeClickToPlay } from "@/components/youtube-click-to-play";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jahr: string }>;
}) {
  const { jahr: jahrParam } = await params;
  const jahr = Number(jahrParam);
  const lager = await getLagerByJahr(jahr);
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
    familienzugang?: string;
    fotos?: string;
    vorschau?: string;
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
  const preise = lager.preise || [];
  const aktivitaeten = lager.aktivitaeten || [];
  const fotosUrl = documentResult.fotoalbum?.url || "";
  const validFotosUrl = !!fotosUrl && isValidHttpUrl(fotosUrl);
  const validVideoUrl = !!lager.youtube_url && isValidHttpUrl(lager.youtube_url);
  const ytId = youtubeId(lager.youtube_url);

  const showFamilyGate =
    !documentResult.accessGranted &&
    (documentResult.hasProtected || documentResult.hasProtectedPhoto);
  const returnToPhotos = search?.fotos === "1";
  const photosQuery = returnToPhotos ? "&fotos=1" : "";

  async function unlockFamilyAccess(formData: FormData) {
    "use server";
    const headerStore = await headers();
    const ip = clientIp(headerStore);
    if (!unlockAttemptAllowed(ip)) {
      redirect(`/lager/${jahr}?familienzugang=blockiert${photosQuery}#familienzugang`);
    }

    const password = formData.get("password");
    if (typeof password !== "string" || !(await isFamilyPassword(password))) {
      recordUnlockFailure(ip);
      redirect(`/lager/${jahr}?familienzugang=fehler${photosQuery}#familienzugang`);
    }

    const cookieStore2 = await cookies();
    cookieStore2.set(FAMILY_ACCESS_COOKIE, await familyAccessCookieValue(), {
      httpOnly: true,
      maxAge: FAMILY_ACCESS_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: headerStore.get("x-forwarded-proto") === "https",
    });
    redirect(returnToPhotos ? "/fotos" : `/lager/${jahr}#dokumente`);
  }

  return (
    <article className="bg-sand">
      {lager.status === "entwurf" ? (
        <div className="bg-amber-300 px-4 py-2 text-center text-sm font-bold text-ink">
          Entwurfsvorschau – dieses Lager ist noch nicht öffentlich.
        </div>
      ) : null}
      <header className="bg-ink text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-light">
            {zeitraum}
          </p>
          <h1 className="camp-display mt-4 text-4xl leading-none sm:text-5xl">
            {lager.titel || `Lager ${jahr}`}
          </h1>
          {beschreibung ? (
            <div
              className="mt-5 max-w-2xl font-semibold leading-relaxed text-white/80 [&_a]:text-accent-light [&_a]:underline [&_p+p]:mt-4"
              dangerouslySetInnerHTML={{ __html: beschreibung }}
            />
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            {lager.teilnehmer ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
                <UsersRound className="size-4 text-accent-light" />
                {lager.teilnehmer} Teilnehmende
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
                  className="rounded-full border border-ink/10 bg-white px-3 py-1.5 text-sm font-semibold text-ink"
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
            className="scroll-mt-20 rounded-[1.75rem] border border-ink/10 bg-white p-6 sm:p-8"
          >
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 size-6 shrink-0 text-accent" />
              <div>
                <h2 className="camp-display text-2xl text-ink">
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
            <ul className="overflow-hidden divide-y divide-ink/8 rounded-[1.75rem] border border-ink/10 bg-white">
              {dokumente.map((document) => (
                <DocumentRow key={document.id} doc={document} />
              ))}
            </ul>
          )}
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
              className="flex flex-col items-start gap-3 rounded-[1.75rem] border border-ink/10 bg-white p-6 transition hover:-translate-y-1 hover:border-ink/20 hover:shadow-[0_18px_45px_rgba(14,28,48,0.08)] sm:flex-row sm:items-center sm:justify-between"
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
          </section>
        ) : null}

        {validVideoUrl ? (
          <section>
            <h2 className="camp-display mb-5 text-2xl text-ink sm:text-3xl">
              Video
            </h2>
            {ytId ? <YoutubeClickToPlay id={ytId} /> : null}
            {!ytId ? (
              <a
                href={lager.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline"
              >
                Video öffnen <ExternalLink className="size-4" />
              </a>
            ) : null}
          </section>
        ) : null}

        {lager.quelle_url ? (
          <section className="rounded-[1.75rem] border border-ink/10 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Historische Quelle
            </p>
            <a
              href={lager.quelle_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
            >
              Ursprüngliche Lagerseite öffnen <ExternalLink className="size-3.5" />
            </a>
          </section>
        ) : null}

        {links.length > 0 ? (
          <section className="rounded-[1.75rem] border border-ink/10 bg-white p-6">
            <h2 className="camp-display mb-4 text-2xl text-ink">Nützliche Links</h2>
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
        className="flex items-center justify-between gap-4 p-4 transition hover:bg-accent/[0.04] sm:p-5"
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
