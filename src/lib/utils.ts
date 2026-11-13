import type { DokumentRecord, FotoalbumRecord, LagerRecord } from "./pb-types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function pickNeustesFotoalbum(
  fotoalben: FotoalbumRecord[],
  lager: LagerRecord[]
): { fotoalbum: FotoalbumRecord; jahr: number } | null {
  const jahre = new Map(lager.map((record) => [record.id, record.jahr] as const));
  const jahrVon = (album: FotoalbumRecord) =>
    jahre.get(album.lager) || 0;
  const fotoalbum = [...fotoalben]
    .filter((album) => jahrVon(album) > 0)
    .sort(
      (a, b) => jahrVon(b) - jahrVon(a) || b.updated.localeCompare(a.updated)
    )[0];
  return fotoalbum ? { fotoalbum, jahr: jahrVon(fotoalbum) } : null;
}

/**
 * Admin-Übersicht: welches Lager im Entwurf und welches aktive Lager im Fokus steht.
 * Aktiv: das veröffentlichte Lager (die DB erlaubt nur eines, siehe Migration 14).
 * Entwurf: von mehreren der nächste anstehende (frühestes Jahr ab heute), sonst der neueste.
 */
export function fokusLager(lager: LagerRecord[], jahrHeute: number) {
  const entwuerfe = lager.filter((l) => l.status === "entwurf").sort((a, b) => b.jahr - a.jahr);
  const anstehend = entwuerfe.filter((l) => l.jahr >= jahrHeute);
  const entwurf = anstehend[anstehend.length - 1] ?? entwuerfe[0] ?? null;
  return {
    aktiv: lager.find((l) => l.status === "veroeffentlicht") ?? null,
    entwurf,
    weitereEntwuerfe: entwuerfe.filter((l) => l !== entwurf),
  };
}

function luminanz(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG-Kontrast zweier Farben (#rrggbb): 1 bis 21. */
export function kontrast(a: string, b: string): number {
  const [hell, dunkel] = [luminanz(a), luminanz(b)].sort((x, y) => y - x);
  return (hell + 0.05) / (dunkel + 0.05);
}

/** Standardfarben wie in globals.css: Eisblau auf hellem, Signalorange auf dunklem Grund. */
export const AKZENT_STANDARD = "#2563eb";
export const AKZENT_DUNKEL_STANDARD = "#ff5a36";
/** Nachtblau (--color-ink): dunkler Grund und Schrift auf dem Orange. */
export const DUNKLER_GRUND = "#0f1e33";

/**
 * Akzentfarbe aus dem Cockpit, nur wenn gültig und lesbar (≥ 4.5:1) gegenüber `gegen`:
 * Blau trägt weisse Schrift, Orange steht auf Nachtblau und trägt nachtblaue Schrift.
 */
export function akzentfarbe(wert: unknown, gegen = "#ffffff"): string | null {
  return typeof wert === "string" && /^#[0-9a-f]{6}$/i.test(wert) && kontrast(wert, gegen) >= 4.5
    ? wert.toLowerCase()
    : null;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NB = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];
const NB_LONG = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

// Lagerdaten sind reine Kalendertage, gespeichert als UTC-Mitternacht. Deshalb überall
// UTC lesen, sonst verschiebt sich das Datum westlich von UTC um einen Tag.
const asDate = (d: string | Date) => (typeof d === "string" ? new Date(d) : d);

/** "30. Jan – 6. Feb 2027" — de-CH, ohne führende Null beim Tag. */
export function formatDateRange(von: string | Date, bis: string | Date): string {
  const a = asDate(von);
  const b = asDate(bis);
  return `${a.getUTCDate()}. ${NB[a.getUTCMonth()]} – ${b.getUTCDate()}. ${NB[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
}

/** "30. Januar – 6. Februar 2027" */
export function formatDateRangeLong(von: string | Date, bis: string | Date): string {
  const a = asDate(von);
  const b = asDate(bis);
  return `${a.getUTCDate()}. ${NB_LONG[a.getUTCMonth()]} – ${b.getUTCDate()}. ${NB_LONG[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
}

const WOCHENTAG = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

/** "Sa 31. Januar – Sa 7. Februar 2026" (Lager beginnen und enden meist an einem Samstag). */
export function formatDateRangeWithDays(von: string | Date, bis: string | Date): string {
  const a = asDate(von);
  const b = asDate(bis);
  return `${WOCHENTAG[a.getUTCDay()]} ${a.getUTCDate()}. ${NB_LONG[a.getUTCMonth()]} – ${WOCHENTAG[b.getUTCDay()]} ${b.getUTCDate()}. ${NB_LONG[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
}

/** Ganze Tage vom heutigen Zürcher Kalendertag bis zum Datum (negativ = vorbei). */
export function tageBis(datum: string | Date, jetzt: Date = new Date()): number {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich" })
    .format(jetzt)
    .split("-")
    .map(Number);
  const ziel = asDate(datum);
  const zielTag = Date.UTC(ziel.getUTCFullYear(), ziel.getUTCMonth(), ziel.getUTCDate());
  return Math.round((zielTag - Date.UTC(y, m - 1, d)) / 86_400_000);
}

export function isoToDateInput(d: string | Date): string {
  return asDate(d).toISOString().slice(0, 10);
}

/** Dauerhafter Download-Link mit lesbarem Namen, z. B. für Mails der Lagerleitung. */
export function documentHref(doc: Pick<DokumentRecord, "collection" | "id" | "name" | "datei">): string {
  const extension = doc.datei.toLowerCase().endsWith(".docx") ? ".docx" : ".pdf";
  const slug =
    doc.name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "dokument";
  return `/api/download/${doc.collection}/${doc.id}/${slug}${extension}`;
}

/** Content-Disposition, die auch «–», „“ oder Emoji im Dokumentnamen übersteht (RFC 6266/5987). */
export function contentDisposition(filename: string): string {
  const ascii = filename
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]|["\\/]/g, "_");
  const utf8 = encodeURIComponent(filename).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `inline; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}


export function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function youtubeId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.hostname.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const m = u.pathname.match(/\/(embed|shorts|v)\/([\w-]+)/);
      if (m) return m[2];
    }
  } catch {
    const m = url.match(/([\w-]{11})/);
    if (m) return m[1];
  }
  return null;
}

/** Letzte gültige Schneehöhe (cm) aus SLF-Messwerten; null, wenn die Station seit über 2 Tagen nichts liefert. */
export type Schneemessung = { cm: number; gemessen: string };

/** Letzte Messung mit gültiger Schneehöhe (cm, gerundet) samt Messzeit; null ohne gültigen Wert. */
export function letzteSchneemessung(messungen: { measure_date: string; HS: number | null }[]): Schneemessung | null {
  const letzte = messungen.findLast((m) => typeof m.HS === "number");
  return letzte ? { cm: Math.max(0, Math.round(letzte.HS!)), gemessen: letzte.measure_date } : null;
}

/**
 * Schneehöhe nur anzeigen, wenn die Messung höchstens 2 Tage alt ist. Geprüft beim Anzeigen, nicht
 * beim Abruf: Ist das SLF länger nicht erreichbar, bleibt der zwischengespeicherte Wert sonst stehen.
 */
export function frischeSchneehoehe(messung: Schneemessung | null | undefined, jetzt: Date = new Date()): number | null {
  if (!messung || jetzt.getTime() - Date.parse(messung.gemessen) > 2 * 86_400_000) return null;
  return messung.cm;
}

// Telefonnummern: einheitliche Anzeige (+41 79 123 45 67) und Anruf-Link im Format E.164 (+41791234567),
// das jedes Handy wählen kann, auch mit ausländischer SIM.
// ponytail: Nur Schweizer Nummern werden gruppiert; ausländische bleiben wie eingegeben. Für deren
// Gruppierung bräuchte es libphonenumber. Nummern ohne Landesvorwahl gelten als schweizerisch.
function schweizE164(roh: string): string | null {
  const s = roh.trim().replace(/\(0\)/g, "");
  const ziffern = s.replace(/\D/g, "");
  const national = s.startsWith("+")
    ? ziffern.startsWith("41") ? ziffern.slice(2) : ""
    : ziffern.startsWith("0041") ? ziffern.slice(4)
    : ziffern.startsWith("0") && !ziffern.startsWith("00") ? ziffern.slice(1) : "";
  return national.length === 9 ? `+41${national}` : null;
}

/** Anzeige: Schweizer Nummern als «+41 79 123 45 67», Gratis- und Mehrwertnummern als «+41 800 123 456». */
export function telefonAnzeige(roh: string): string {
  const e164 = schweizE164(roh);
  if (!e164) return roh.trim().replace(/\s+/g, " ");
  const n = e164.slice(3);
  return /^(800|84[0248]|90[016])/.test(n)
    ? `+41 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`
    : `+41 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 7)} ${n.slice(7)}`;
}

/** Ziel für tel:-Links: E.164 ohne Leerzeichen; Kurznummern wie 144 bleiben. */
export function telefonLink(roh: string): string {
  const e164 = schweizE164(roh);
  if (e164) return e164;
  const ziffern = roh.replace(/\D/g, "");
  if (roh.trim().startsWith("+")) return `+${ziffern}`;
  return ziffern.startsWith("00") ? `+${ziffern.slice(2)}` : ziffern;
}
