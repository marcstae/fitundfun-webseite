import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

function dePad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

/** "30. Jan – 6. Feb 2027" — de-CH, ohne führende Null beim Tag. */
export function formatDateRange(von: string | Date, bis: string | Date): string {
  const a = typeof von === "string" ? new Date(von) : von;
  const b = typeof bis === "string" ? new Date(bis) : bis;
  const sameYear = a.getFullYear() === b.getFullYear();
  const start = `${a.getDate()}. ${NB[a.getMonth()]}`;
  const end = sameYear
    ? `${b.getDate()}. ${NB[b.getMonth()]} ${b.getFullYear()}`
    : `${b.getDate()}. ${NB[b.getMonth()]} ${b.getFullYear()}`;
  return `${start} – ${end}`;
}

/** "30. Januar – 6. Februar 2027" */
export function formatDateRangeLong(von: string | Date, bis: string | Date): string {
  const a = typeof von === "string" ? new Date(von) : von;
  const b = typeof bis === "string" ? new Date(bis) : bis;
  return `${a.getDate()}. ${NB_LONG[a.getMonth()]} – ${b.getDate()}. ${NB_LONG[b.getMonth()]} ${b.getFullYear()}`;
}

export function isoToDateInput(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${dePad(date.getMonth() + 1)}-${dePad(date.getDate())}`;
}

/** Tage zwischen heute (Mitternacht) und Ziel; negativ = vorbei. */
export function daysUntil(target: string | Date): number {
  const t = typeof target === "string" ? new Date(target) : target;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const tgt = new Date(t);
  tgt.setHours(0, 0, 0, 0);
  return Math.round((tgt.getTime() - start.getTime()) / 86_400_000);
}

export type LagerStatus = "before" | "running" | "past";

export function lagerStatus(von: string | Date, bis: string | Date): LagerStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const a = new Date(von);
  a.setHours(0, 0, 0, 0);
  const b = new Date(bis);
  b.setHours(23, 59, 59, 999);
  if (today < a) return "before";
  if (today > b) return "past";
  return "running";
}

export function countdownLabel(von: string | Date, bis: string | Date): string {
  const status = lagerStatus(von, bis);
  if (status === "running") return "Das Lager läuft!";
  if (status === "past") return "Lager abgeschlossen";
  const d = daysUntil(von);
  if (d <= 1) return "Morgen geht's los";
  return `Noch ${d} Tage`;
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

export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
