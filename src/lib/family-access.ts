import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type PocketBase from "pocketbase";
import { pbRequest } from "./pb.ts";
import type { LagerpasswortRecord } from "./pb-types.ts";

export const FAMILY_ACCESS_COOKIE = "fitundfun_family_access";
// 400 Tage = Browser-Obergrenze für Cookies; jeder geschützte Download verlängert sie wieder.
// Ungültig wird der Zugang nur, wenn die Lagerleitung ein neues Lagerpasswort setzt.
const FAMILY_ACCESS_MAX_AGE = 400 * 24 * 60 * 60;

/** Einstellungen des Freischalt-Cookies (Freischalten und Verlängern beim Download). */
export function familyCookieOptionen(forwardedProto: string | null) {
  return {
    httpOnly: true,
    maxAge: FAMILY_ACCESS_MAX_AGE,
    path: "/",
    sameSite: "lax" as const,
    secure: forwardedProto === "https",
  };
}

const familyEmail = process.env.FAMILY_ACCESS_EMAIL || "familie@fitundfun.local";
// Internes Servergeheimnis: Cookie-Signatur und Passwort des PB-Familienkontos.
// Geht nie an Familien; deren Passwort wird nur im Cockpit gesetzt (password_hash).
const familySecret = process.env.FAMILY_ACCESS_SECRET || "";
if (!familySecret) {
  console.error(
    "fitundfun: FAMILY_ACCESS_SECRET ist nicht gesetzt — Freischalten mit Lagerpasswort deaktiviert."
  );
}

/** Zeitkonstanter Vergleich, auch bei ungleicher Länge. */
export function safeEqual(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

const scryptAsync = promisify(scrypt);

export async function hashLagerpasswort(value: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = (await scryptAsync(value, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

export async function pruefeLagerpasswortHash(value: string, encoded: string): Promise<boolean> {
  const [algorithm, saltValue, hashValue] = encoded.split(":");
  if (algorithm !== "scrypt" || !saltValue || !hashValue) return false;
  try {
    const expected = Buffer.from(hashValue, "base64url");
    const actual = (await scryptAsync(value, Buffer.from(saltValue, "base64url"), expected.length)) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/** null, solange im Cockpit kein Lagerpasswort gesetzt wurde. */
async function lagerpasswortEintrag(): Promise<LagerpasswortRecord | null> {
  const result = await mitFamilienkonto((pb) => pb.collection("lagerpasswort").getList<LagerpasswortRecord>(1, 1));
  return result.items[0] ?? null;
}

/**
 * Ohne im Cockpit gesetztes Lagerpasswort bleibt Geschütztes zu (false). Technische Fehler
 * (PocketBase nicht erreichbar, falsches FAMILY_ACCESS_SECRET) werfen: Sie sind kein falsches Passwort.
 */
export async function istLagerpasswort(value: string): Promise<boolean> {
  if (!familySecret) throw new Error("FAMILY_ACCESS_SECRET nicht gesetzt");
  if (!value) return false;
  const config = await lagerpasswortEintrag();
  return !!config?.password_hash && (await pruefeLagerpasswortHash(value, config.password_hash));
}

export async function familyAccessCookieValue(): Promise<string> {
  const eintrag = await lagerpasswortEintrag();
  if (!eintrag) throw new Error("Lagerpasswort ist nicht eingerichtet");
  const version = eintrag.cookie_version;
  const signature = createHmac("sha256", familySecret)
    .update(`fitundfun-family-access-v3:${version}`)
    .digest("base64url");
  return `${version}.${signature}`;
}

export async function hasFamilyAccess(value?: string): Promise<boolean> {
  if (!familySecret || !value) return false;
  try {
    return safeEqual(value, await familyAccessCookieValue());
  } catch {
    return false;
  }
}

// Token des Familienkontos wiederverwenden, statt bei jedem Aufruf neu anzumelden
// (PocketBase begrenzt Anmeldungen pro IP, und alle kommen vom Webserver). Höchstens 5 Minuten,
// zusätzlich zum Zurücksetzen bei 401: Nach einer Wiederherstellung kann es ungültig sein.
let familyToken = "";
let familyTokenSeit = 0;
const FAMILY_TOKEN_MAX_MS = 5 * 60 * 1000;
// Gleichzeitige Seitenaufrufe teilen sich eine Anmeldung, statt das Limit (10 pro Minute) zu sprengen.
let familyLogin: Promise<string> | null = null;

export async function familyPocketBase(): Promise<PocketBase> {
  if (!familySecret) throw new Error("FAMILY_ACCESS_SECRET nicht gesetzt");
  const pb = pbRequest();
  // Seit PocketBase 0.42 kommt ein ungültig gewordenes Token als 401 zurück (z. B. nach einer
  // Wiederherstellung): dann meldet sich der nächste Aufruf neu an, statt bis zu 5 Minuten zu warten.
  pb.afterSend = (response, data) => {
    // Nur verwerfen, wenn diese Anfrage das aktuelle Token benutzt hat (nicht eine späte alte Antwort).
    if (response.status === 401 && pb.authStore.token === familyToken) familyToken = "";
    return data;
  };
  if (familyToken && Date.now() - familyTokenSeit < FAMILY_TOKEN_MAX_MS) {
    pb.authStore.save(familyToken);
    if (pb.authStore.isValid) return pb;
  }
  familyLogin ??= pbRequest()
    .collection("users")
    .authWithPassword(familyEmail, familySecret)
    .then((result) => {
      familyToken = result.token;
      familyTokenSeit = Date.now();
      return result.token;
    })
    .finally(() => {
      familyLogin = null;
    });
  pb.authStore.save(await familyLogin);
  return pb;
}

/**
 * Mit dem Familienkonto lesen. Ist das zwischengespeicherte Token ungültig geworden (401, etwa nach
 * einer Wiederherstellung), setzt afterSend es zurück, und der zweite Versuch meldet sich neu an.
 */
export async function mitFamilienkonto<T>(lesen: (pb: PocketBase) => Promise<T>): Promise<T> {
  try {
    return await lesen(await familyPocketBase());
  } catch (e) {
    if ((e as { status?: number })?.status !== 401) throw e;
    return lesen(await familyPocketBase());
  }
}

// ponytail: In-Memory-Limits pro Prozess; bei mehreren Web-Instanzen bräuchte es einen geteilten Speicher.
type Attempts = { count: number; resetAt: number };
const unlockAttempts = new Map<string, Attempts>();
const MAX_UNLOCK_ATTEMPTS = 10;
// Die Client-IP stammt aus Headern, die ohne Reverse Proxy frei setzbar sind. Deshalb zählt
// zusätzlich jeder Fehlversuch global. ponytail: Ein Angreifer kann so das Freischalten bis zu
// einer Stunde für alle blockieren; besser als unbegrenztes Durchprobieren des Lagerpassworts.
let globalAttempts: Attempts = { count: 0, resetAt: 0 };
const MAX_GLOBAL_UNLOCK_ATTEMPTS = 50;
const UNLOCK_WINDOW_MS = 60 * 60 * 1000;
const MAX_UNLOCK_TRACKED_IPS = 10_000;

function within(entry: Attempts | undefined, max: number): boolean {
  return !entry || Date.now() > entry.resetAt || entry.count < max;
}

function counted(entry: Attempts | undefined): Attempts {
  if (!entry || Date.now() > entry.resetAt) return { count: 1, resetAt: Date.now() + UNLOCK_WINDOW_MS };
  return { ...entry, count: entry.count + 1 };
}

export function clientIp(requestHeaders: Headers): string {
  // CF-Connecting-IP setzt Cloudflare selbst; verlässlich, weil die Website nur über den
  // Cloudflare Tunnel erreichbar ist (Ports nicht im Heimnetz, siehe docker-compose.yml).
  // X-Real-IP und X-Forwarded-For sind client-kontrollierbar und dienen nur als Fallback.
  return (
    requestHeaders.get("cf-connecting-ip")?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function unlockAttemptAllowed(ip: string): boolean {
  return (
    within(globalAttempts, MAX_GLOBAL_UNLOCK_ATTEMPTS) &&
    within(unlockAttempts.get(ip), MAX_UNLOCK_ATTEMPTS)
  );
}

/**
 * Gibt einen reservierten Versuch zurück (richtiges Passwort oder technischer Fehler). Reserviert wird
 * mit recordUnlockFailure vor der asynchronen Prüfung, damit gleichzeitige Anfragen das Limit nicht
 * unterlaufen.
 */
export function releaseUnlockAttempt(ip: string): void {
  const frei = (entry: Attempts) =>
    Date.now() <= entry.resetAt && entry.count > 0 ? { ...entry, count: entry.count - 1 } : entry;
  globalAttempts = frei(globalAttempts);
  const entry = unlockAttempts.get(ip);
  if (entry) unlockAttempts.set(ip, frei(entry));
}

export function recordUnlockFailure(ip: string): void {
  globalAttempts = counted(globalAttempts);
  // ponytail: Cap statt Alters-Sweeping; reicht, solange die Map unter 10k bleibt.
  if (!unlockAttempts.has(ip) && unlockAttempts.size >= MAX_UNLOCK_TRACKED_IPS) {
    const oldest = unlockAttempts.keys().next().value;
    if (oldest !== undefined) unlockAttempts.delete(oldest);
  }
  unlockAttempts.set(ip, counted(unlockAttempts.get(ip)));
}
