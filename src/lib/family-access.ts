import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type PocketBase from "pocketbase";
import { pbRequest } from "./pb.ts";
import type { FamilienzugangRecord } from "./pb-types.ts";

export const FAMILY_ACCESS_COOKIE = "fitundfun_family_access";
// ponytail: 400 Tage = Chromium/Safari Cookie-Obergrenze; für 18 Monate wäre ein Refresh nötig.
export const FAMILY_ACCESS_MAX_AGE = 400 * 24 * 60 * 60;

const familyEmail = process.env.FAMILY_ACCESS_EMAIL || "familie@fitundfun.local";
// Internes Servergeheimnis: Cookie-Signatur und Passwort des PB-Familienkontos.
// Geht nie an Familien; deren Passwort wird nur im Cockpit gesetzt (password_hash).
const familySecret = process.env.FAMILY_ACCESS_SECRET || "";
if (!familySecret) {
  console.error(
    "fitundfun: FAMILY_ACCESS_SECRET ist nicht gesetzt — Familienzugang deaktiviert."
  );
}

function safeEqual(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

const scryptAsync = promisify(scrypt);

export async function hashFamilyPassword(value: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = (await scryptAsync(value, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

export async function verifyFamilyPasswordHash(value: string, encoded: string): Promise<boolean> {
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

async function familyConfig(): Promise<FamilienzugangRecord> {
  const pb = await familyPocketBase();
  const result = await pb.collection("familienzugang").getList<FamilienzugangRecord>(1, 1);
  if (!result.items[0]) throw new Error("Familienzugang ist nicht eingerichtet");
  return result.items[0];
}

/** Ohne im Cockpit gesetztes Familienpasswort ist der Familienzugang geschlossen. */
export async function isFamilyPassword(value: string): Promise<boolean> {
  if (!value || !familySecret) return false;
  try {
    const config = await familyConfig();
    return !!config.password_hash && (await verifyFamilyPasswordHash(value, config.password_hash));
  } catch {
    return false;
  }
}

export async function familyAccessCookieValue(): Promise<string> {
  const version = (await familyConfig()).cookie_version;
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
// (PocketBase begrenzt Anmeldungen pro IP, und alle kommen vom Webserver).
let familyToken = "";

export async function familyPocketBase(): Promise<PocketBase> {
  if (!familySecret) throw new Error("FAMILY_ACCESS_SECRET nicht gesetzt");
  const pb = pbRequest();
  if (familyToken) {
    pb.authStore.save(familyToken);
    if (pb.authStore.isValid) return pb;
  }
  await pb.collection("users").authWithPassword(familyEmail, familySecret);
  familyToken = pb.authStore.token;
  return pb;
}

// ponytail: In-Memory-Limits pro Prozess; bei mehreren Web-Instanzen bräuchte es einen geteilten Speicher.
type Attempts = { count: number; resetAt: number };
const unlockAttempts = new Map<string, Attempts>();
const MAX_UNLOCK_ATTEMPTS = 10;
// Die Client-IP stammt aus Headern, die ohne Reverse Proxy frei setzbar sind. Deshalb zählt
// zusätzlich jeder Fehlversuch global. ponytail: Ein Angreifer kann so das Freischalten bis zu
// einer Stunde für alle blockieren; besser als unbegrenztes Durchprobieren des Familienpassworts.
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
  // X-Real-IP wird vom Reverse Proxy verlässlich überschrieben; X-Forwarded-For
  // ist client-kontrollierbar und darf nur als Fallback dienen.
  return (
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

export function recordUnlockFailure(ip: string): void {
  globalAttempts = counted(globalAttempts);
  // ponytail: Cap statt Alters-Sweeping; reicht, solange die Map unter 10k bleibt.
  if (!unlockAttempts.has(ip) && unlockAttempts.size >= MAX_UNLOCK_TRACKED_IPS) {
    const oldest = unlockAttempts.keys().next().value;
    if (oldest !== undefined) unlockAttempts.delete(oldest);
  }
  unlockAttempts.set(ip, counted(unlockAttempts.get(ip)));
}
