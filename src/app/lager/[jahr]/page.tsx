import Link from "next/link";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Images,
  Info,
  Link2,
  Lock,
  Mail,
  PlayCircle,
  Snowflake,
  UsersRound,
  type LucideIcon,
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

  const titelZusatz = lager.titel && lager.titel !== `Lager ${jahr}` ? lager.titel : "";
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

  return (
    <article className="bg-sand pb-12">
      {lager.status === "entwurf" ? (
        <div className="bg-amber-300 px-4 py-2 text-center text-sm font-bold text-ink">
          Entwurfsvorschau – dieses Lager ist noch nicht öffentlich.
        </div>
      ) : null}

      {/* Winterlicher Kopf: dasselbe Bild wie auf der Startseite, unten dunkel für lesbare Schrift. */}
      <header className="relative isolate overflow-hidden bg-navy-900 text-white">
        <img
          src={kopfbild}
          alt=""
          aria-hidden
          className="absolute inset-0 -z-20 size-full object-cover object-[50%_45%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/25"
        />
        <div className="mx-auto max-w-3xl px-4 pb-7 pt-14 sm:px-6 sm:pb-10 sm:pt-24">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] backdrop-blur-sm">
            <Snowflake className="size-3.5" aria-hidden />
            {statusLabel(lager)}
          </p>
          {titelZusatz ? (
            <p className="mt-4 text-sm font-semibold text-white/80">{titelZusatz}</p>
          ) : null}
          <h1 className={`camp-display text-5xl leading-none sm:text-7xl ${titelZusatz ? "mt-1" : "mt-4"}`}>
            Lager {jahr}
          </h1>
          <ul className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
            {zeitraum ? (
              <li className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-2 backdrop-blur-sm">
                <CalendarDays className="size-4 text-accent-light" aria-hidden />
                {zeitraum}
              </li>
            ) : null}
            {countdown(lager) ? (
              <li className="inline-flex items-center rounded-full bg-accent-light px-3.5 py-2 font-bold text-ink">
                {countdown(lager)}
              </li>
            ) : null}
            {lager.teilnehmer ? (
              <li className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-2 backdrop-blur-sm">
                <UsersRound className="size-4 text-accent-light" aria-hidden />
                {lager.teilnehmer} Teilnehmende
              </li>
            ) : null}
          </ul>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-9 px-4 pt-7 sm:space-y-12 sm:px-6 sm:pt-10">
        <Section id="dokumente" icon={FileText} titel="Dokumente" meta={dokumente.length ? `${dokumente.length}` : ""}>
          {dokumente.length === 0 ? (
            <Card>
              <p className="p-5 text-sm text-muted">
                Noch keine Dokumente – sie erscheinen hier, sobald die Lagerleitung sie hochlädt.
              </p>
            </Card>
          ) : (
            <Card>
              <ul className="divide-y divide-ink/[0.07]">
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
            </Card>
          )}
        </Section>

        {beschreibung ? (
          <Section id="infos" icon={Info} titel="Infos">
            <Card>
              <div
                className="wrap-break-word p-5 text-base leading-relaxed text-ink/85 sm:p-6 [&_a]:font-semibold [&_a]:text-accent [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-3 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: beschreibung }}
              />
            </Card>
          </Section>
        ) : null}

        {aktivitaeten.length > 0 ? (
          <Section id="aktivitaeten" icon={Snowflake} titel="Aktivitäten">
            <ul className="flex flex-wrap gap-2">
              {aktivitaeten.map((aktivitaet) => (
                <li
                  key={aktivitaet}
                  className="rounded-full border border-ink/10 bg-white px-3.5 py-2 text-sm font-semibold text-ink"
                >
                  {aktivitaet}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {zeigeFotos ? (
          <Section id="fotos" icon={Images} titel="Fotos">
            <Card>
              <FamilyUnlock
                action={unlockFamilyAccess}
                href={validFotosUrl ? fotosUrl : null}
                locked={locked}
                autoOpen={vonFotos}
                className={ROW}
              >
                <RowContent
                  icon={locked ? Lock : Images}
                  titel="Fotoalbum"
                  hinweis="Fotos ansehen und eigene hochladen"
                  aktion={ExternalLink}
                />
              </FamilyUnlock>
            </Card>
          </Section>
        ) : null}

        {validVideoUrl ? (
          <Section id="video" icon={PlayCircle} titel="Video">
            {ytId ? (
              <YoutubeClickToPlay id={ytId} />
            ) : (
              <Card>
                <a href={lager.youtube_url} target="_blank" rel="noopener noreferrer" className={ROW}>
                  <RowContent icon={PlayCircle} titel="Lagervideo" hinweis="Öffnet in einem neuen Tab" aktion={ExternalLink} />
                </a>
              </Card>
            )}
          </Section>
        ) : null}

        {links.length > 0 || altLink ? (
          <Section id="links" icon={Link2} titel="Nützliche Links">
            <Card>
              <ul className="divide-y divide-ink/[0.07]">
                {altLink ? (
                  <li>
                    <a href={altLink} target="_blank" rel="noopener noreferrer" className={ROW}>
                      <RowContent icon={Images} titel="Fotos und Berichte" hinweis="Alte Lagerseite" aktion={ExternalLink} />
                    </a>
                  </li>
                ) : null}
                {links.map((link) => (
                  <li key={link.id}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className={ROW}>
                      <RowContent icon={Link2} titel={link.titel} hinweis={hostname(link.url)} aktion={ExternalLink} />
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          </Section>
        ) : null}

        <nav aria-label="Weiter" className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/kontakt"
            className="flex min-h-14 items-center gap-3 rounded-2xl bg-ink px-5 text-white transition hover:bg-navy-900 active:bg-navy-900"
          >
            <Mail className="size-5 shrink-0 text-accent-light" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Fragen zum Lager?</span>
              <span className="block text-xs text-white/70">Schreib der Lagerleitung</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-white/50" aria-hidden />
          </Link>
          <Link
            href="/lager"
            className="flex min-h-14 items-center gap-3 rounded-2xl border border-ink/10 bg-white px-5 text-ink transition hover:border-ink/20 active:bg-sand"
          >
            <ArrowLeft className="size-5 shrink-0 text-accent" aria-hidden />
            <span className="text-sm font-bold">Alle Lager</span>
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

const ROW =
  "group flex min-h-[4.25rem] w-full items-center gap-3.5 px-4 py-3 text-left transition hover:bg-sand/70 active:bg-sand sm:px-5";

function Section({
  id,
  icon: Icon,
  titel,
  meta,
  children,
}: {
  id: string;
  icon: LucideIcon;
  titel: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-titel`} className="scroll-mt-20">
      <h2 id={`${id}-titel`} className="mb-3 flex items-center gap-2 text-lg font-bold text-ink">
        <Icon className="size-5 text-accent" aria-hidden />
        {titel}
        {meta ? (
          <span className="ml-1 rounded-full bg-ink/[0.06] px-2 py-0.5 text-xs font-bold text-muted">{meta}</span>
        ) : null}
      </h2>
      {children}
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-ink/[0.08] bg-white shadow-[0_1px_2px_rgba(15,30,51,0.04)]">
      {children}
    </div>
  );
}

function RowContent({
  icon: Icon,
  titel,
  hinweis,
  aktion: Aktion,
}: {
  icon: LucideIcon;
  titel: string;
  hinweis?: string;
  aktion: LucideIcon;
}) {
  return (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand text-accent">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug text-ink">{titel}</span>
        {hinweis ? <span className="block truncate text-xs text-muted">{hinweis}</span> : null}
      </span>
      <Aktion className="size-5 shrink-0 text-muted transition group-hover:text-accent" aria-hidden />
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
    <RowContent
      icon={doc.sensibel ? Lock : FileText}
      titel={doc.name}
      hinweis={doc.sensibel ? `${fileType} · mit Familienpasswort` : fileType}
      aktion={Download}
    />
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
