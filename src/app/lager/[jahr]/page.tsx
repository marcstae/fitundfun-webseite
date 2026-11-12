import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Download,
  Images,
  Lock,
  LockOpen,
  MapPin,
  UsersRound,
} from "lucide-react";
import {
  getDokumenteForLager,
  getEinstellungen,
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
import { publicFileUrl } from "@/lib/pb";
import { LAGERHAUS_MAPS_URL } from "@/lib/site";
import {
  documentHref,
  formatDateRangeWithDays,
  isValidHttpUrl,
  tageBis,
  youtubeId,
} from "@/lib/utils";
import { richTextToPlainText, sanitizeRichText } from "@/lib/sanitize";
import type { DokumentRecord, LagerRecord } from "@/lib/pb-types";
import { YoutubeClickToPlay } from "@/components/youtube-click-to-play";
import { FamilyUnlock, type UnlockAction, type UnlockState } from "@/components/family-unlock";

export const dynamic = "force-dynamic";

// Links auf geschützte Dokumente (aus Mails), die nach dem Freischalten geöffnet werden.
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
  const [documentResult, links, einstellungen] = await Promise.all([
    getDokumenteForLager(lager.id, authCookie, familyAccess),
    getLinks(),
    getEinstellungen().catch(() => null),
  ]);
  const dokumente = documentResult.items;

  const zeitraum =
    lager.datum_von && lager.datum_bis
      ? formatDateRangeWithDays(lager.datum_von, lager.datum_bis)
      : "";
  const beschreibung = sanitizeRichText(lager.beschreibung || "");
  const aktivitaeten = lager.aktivitaeten || [];
  const fotosUrl = documentResult.fotoalbum?.url || "";
  const validFotosUrl = !!fotosUrl && isValidHttpUrl(fotosUrl);
  const validVideoUrl = !!lager.youtube_url && isValidHttpUrl(lager.youtube_url);
  const ytId = youtubeId(lager.youtube_url);
  const altLink = lager.quelle_url && isValidHttpUrl(lager.quelle_url) ? lager.quelle_url : "";
  const kopfbild = einstellungen?.hero_poster
    ? publicFileUrl("einstellungen", einstellungen.id, einstellungen.hero_poster)
    : "/hero-poster.jpg";

  const locked = !documentResult.accessGranted;
  const weiter = search?.weiter && WEITER.test(search.weiter) ? search.weiter : "";
  const weiterId = weiter.split("/")[4] || "";
  const vonFotos = search?.fotos === "1";
  const zeigeFotos = (validFotosUrl && !locked) || (documentResult.hasProtectedPhoto && locked);

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

  const hatGeschuetzte = dokumente.some((d) => d.sensibel);
  const hinweis = countdown(lager);
  return (
    <article className="bg-sand pb-10">
      {lager.status === "entwurf" ? (
        <div className="bg-amber-300 px-4 py-2 text-center text-sm font-bold text-ink">
          Entwurfsvorschau – dieses Lager ist noch nicht öffentlich.
        </div>
      ) : null}

      {/* Lager-Karte im Stil der Menü-Plakette: Dunkelblau mit Winterbild, Orange als Akzent. */}
      <div className="mx-auto max-w-2xl px-3 pt-3 sm:px-6 sm:pt-6">
        <header className="relative isolate overflow-hidden rounded-[1.75rem] bg-navy-900 text-white">
          <img
            src={kopfbild}
            alt=""
            aria-hidden
            className="absolute inset-0 -z-20 size-full object-cover object-[50%_40%]"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-950 via-navy-950/75 to-navy-950/10" />
          <div className="px-5 pb-5 pt-24 sm:px-8 sm:pb-8 sm:pt-36">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-light">
              {statusLabel(lager)}
            </p>
            <h1 className="camp-display mt-1.5 text-[2.75rem] leading-none sm:text-6xl">Lager {jahr}</h1>
            {zeitraum ? (
              <p className="mt-3 flex items-center gap-2 text-[0.95rem] font-semibold text-white/90">
                <CalendarDays className="size-4 shrink-0 text-accent-light" aria-hidden />
                {zeitraum}
              </p>
            ) : null}
            {hinweis || lager.teilnehmer ? (
              <p className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
                {hinweis ? (
                  <span className="rounded-full bg-accent-light px-3.5 py-1.5 text-ink">{hinweis}</span>
                ) : null}
                {lager.teilnehmer ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 backdrop-blur-sm">
                    <UsersRound className="size-4" aria-hidden />
                    {lager.teilnehmer} Teilnehmende
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
        </header>
      </div>

      <div className="mx-auto max-w-2xl space-y-8 px-3 pt-3 sm:space-y-10 sm:px-6">
        <section id="dokumente" aria-labelledby="dokumente-titel" className={ANKER}>
          <h2 id="dokumente-titel" className={H2}>Dokumente</h2>
          {dokumente.length === 0 ? (
            <p className="rounded-2xl bg-white p-5 text-sm text-muted">
              Noch keine Dokumente – sie erscheinen hier, sobald die Lagerleitung sie hochlädt.
            </p>
          ) : (
            <>
              {/* Eine Liste in der Reihenfolge, die die Lagerleitung im Cockpit festlegt. */}
              <ul className="divide-y divide-ink/[0.07] overflow-hidden rounded-2xl bg-white">
                {dokumente.map((d) => (
                  <DocumentRow
                    key={d.id}
                    doc={d}
                    unlock={d.sensibel ? unlockFamilyAccess : null}
                    locked={locked}
                    autoOpen={d.id === weiterId}
                  />
                ))}
              </ul>
              {hatGeschuetzte && locked ? (
                <p className="mt-2 px-1 text-xs text-muted">
                  Dokumente mit Schloss öffnen nach der einmaligen Eingabe des Lagerpassworts.
                </p>
              ) : null}
            </>
          )}
        </section>

        {beschreibung || aktivitaeten.length ? (
          <section id="infos" aria-labelledby="infos-titel" className={ANKER}>
            <h2 id="infos-titel" className={H2}>Infos</h2>
            <div className="rounded-2xl bg-white p-5 sm:p-6">
              {beschreibung ? (
                <div
                  className="wrap-break-word text-base leading-relaxed text-ink/85 [&_a]:font-semibold [&_a]:text-accent [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-3 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: beschreibung }}
                />
              ) : null}
              {aktivitaeten.length ? (
                <ul
                  aria-label="Aktivitäten"
                  className={`flex flex-wrap gap-1.5 ${beschreibung ? "mt-5 border-t border-ink/[0.07] pt-5" : ""}`}
                >
                  {aktivitaeten.map((aktivitaet) => (
                    <li key={aktivitaet} className="rounded-full bg-sand px-3 py-1.5 text-sm font-semibold text-ink">
                      {aktivitaet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ) : null}

        {zeigeFotos || validVideoUrl ? (
          <section id="fotos" aria-labelledby="fotos-titel" className={ANKER}>
            <h2 id="fotos-titel" className={H2}>Fotos &amp; Video</h2>
            <div className="space-y-3">
              {zeigeFotos ? (
                <FamilyUnlock
                  action={unlockFamilyAccess}
                  href={validFotosUrl ? fotosUrl : null}
                  locked={locked}
                  autoOpen={vonFotos}
                  className="flex min-h-20 w-full items-center gap-4 rounded-2xl bg-ink px-5 py-4 text-left text-white transition active:bg-navy-950"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-light text-ink">
                    {locked ? <Lock className="size-5" aria-hidden /> : <Images className="size-5" aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">Fotoalbum</span>
                    <span className="block text-sm text-white/70">
                      {locked ? "Mit Lagerpasswort" : "Ansehen und eigene Fotos hochladen"}
                    </span>
                  </span>
                  <ArrowUpRight className="size-5 shrink-0 text-white/60" aria-hidden />
                </FamilyUnlock>
              ) : null}
              {validVideoUrl ? (
                ytId ? (
                  <YoutubeClickToPlay id={ytId} />
                ) : (
                  <a href={lager.youtube_url} target="_blank" rel="noopener noreferrer" className={LINK_KARTE}>
                    <span className="min-w-0 flex-1 font-bold">Lagervideo ansehen</span>
                    <ArrowUpRight className="size-5 shrink-0 text-muted" aria-hidden />
                  </a>
                )
              ) : null}
            </div>
          </section>
        ) : null}

        {links.length || altLink ? (
          <section id="links" aria-labelledby="links-titel" className={ANKER}>
            <h2 id="links-titel" className={H2}>Nützliche Links</h2>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {altLink ? (
                <li className="col-span-2">
                  <a href={altLink} target="_blank" rel="noopener noreferrer" className={LINK_KARTE}>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">Fotos und Berichte</span>
                      <span className="block text-xs text-muted">Alte Lagerseite</span>
                    </span>
                    <ArrowUpRight className="size-5 shrink-0 text-muted" aria-hidden />
                  </a>
                </li>
              ) : null}
              {links.map((link) => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className={`${LINK_KARTE} h-full`}>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold leading-snug">{link.titel}</span>
                      <span className="block truncate text-xs text-muted">{hostname(link.url)}</span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 self-start text-muted" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <nav aria-label="Weiter" className="space-y-2.5">
          <a href={LAGERHAUS_MAPS_URL} target="_blank" rel="noopener noreferrer" className={LINK_KARTE}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-accent">
              <MapPin className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">Weg zum Lagerhaus</span>
              <span className="block text-sm text-muted">Ferienheim Albin in Google Maps</span>
            </span>
            <ArrowUpRight className="size-5 shrink-0 text-muted" aria-hidden />
          </a>
          <Link
            href="/lager"
            className="inline-flex min-h-12 items-center gap-2 px-2 text-sm font-bold text-muted hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden /> Alle Lager
          </Link>
        </nav>
      </div>
    </article>
  );
}

function statusLabel(lager: LagerRecord) {
  if (lager.status === "entwurf") return "Entwurf";
  if (lager.status === "archiviert") return "Früheres Lager";
  if (lager.datum_bis && tageBis(lager.datum_bis) < 0) return "Letztes Lager";
  return "Nächstes Lager";
}

function countdown(lager: LagerRecord) {
  if (lager.status === "archiviert" || !lager.datum_von || !lager.datum_bis) return "";
  const bisStart = tageBis(lager.datum_von);
  if (bisStart > 1) return `Noch ${bisStart} Tage`;
  if (bisStart === 1) return "Morgen geht's los";
  if (tageBis(lager.datum_bis) >= 0) return "Das Lager läuft";
  return "";
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Sprungziele (z. B. #dokumente) landen unter der Kopfzeile (4rem).
const ANKER = "scroll-mt-20";
const H2 = "camp-display mb-3 px-1 text-2xl text-ink";
const LINK_KARTE =
  "flex min-h-16 w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-ink transition hover:bg-white/70 active:bg-ink/5";
const ROW =
  "flex min-h-[4.5rem] w-full items-center gap-3.5 px-4 py-3 text-left transition hover:bg-sand/60 active:bg-sand";

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
  const fileType = doc.datei.toLowerCase().endsWith(".docx") ? "DOC" : "PDF";
  const content = (
    <>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-[0.7rem] font-bold tracking-wide text-accent">
        {fileType}
      </span>
      <span className="min-w-0 flex-1 text-[1.02rem] font-semibold leading-snug text-ink">{doc.name}</span>
      {/* Geschützt: Schloss links vom Download-Knopf, geschlossen bis das Passwort stimmt, danach offen. */}
      {unlock ? (
        locked ? (
          <Lock className="size-5 shrink-0 text-ink/60" aria-label="Mit Lagerpasswort geschützt" />
        ) : (
          <LockOpen className="size-5 shrink-0 text-accent" aria-label="Freigeschaltet" />
        )
      ) : null}
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-white">
        <Download className="size-[1.1rem]" aria-hidden />
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
