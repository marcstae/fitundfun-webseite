import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type PocketBase from "pocketbase";
import { pbRequest } from "./pb.ts";
import type { FamilienzugangRecord } from "./pb-types.ts";

export const FAMILY_ACCESS_COOKIE = "fitundfun_family_access";
// ponytail: 400 Tage = Chromium/Safari Cookie-Obergrenze; für 18 Monate wäre ein Refresh nötig.
export const FAMILY_ACCESS_MAX_AGE = 400 * 24 * 60 * 60;

const familyEmail = process.env.FAMILY_ACCESS_EMAIL || "familie@fitundfun.local";
const familyPassword = process.env.FAMILY_ACCESS_PASSWORD || "";
if (!familyPassword) {
  console.error(
    "fitundfun: FAMILY_ACCESS_PASSWORD ist nicht gesetzt — Familienzugang deaktiviert."
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

export async function isFamilyPassword(value: string): Promise<boolean> {
  if (!value || !familyPassword) return false;
  try {
    const config = await familyConfig();
    return config.password_hash
      ? verifyFamilyPasswordHash(value, config.password_hash)
      : safeEqual(value, familyPassword);
  } catch {
    return false;
  }
}

export async function familyAccessCookieValue(): Promise<string> {
  const version = (await familyConfig()).cookie_version;
  const signature = createHmac("sha256", familyPassword)
    .update(`fitundfun-family-access-v2:${version}`)
    .digest("base64url");
  return `${version}.${signature}`;
}

export async function hasFamilyAccess(value?: string): Promise<boolean> {
  if (!familyPassword || !value) return false;
  try {
    return safeEqual(value, await familyAccessCookieValue());
  } catch {
    return false;
  }
}

export async function familyPocketBase(): Promise<PocketBase> {
  if (!familyPassword) throw new Error("FAMILY_ACCESS_PASSWORD nicht gesetzt");
  const pb = pbRequest();
  // ponytail: eine Auth-Anfrage pro geschützter Seite/Download; cachen erst wenn messbar nötig.
  await pb
    .collection("users")
    .authWithPassword(familyEmail, `${familyPassword}-internal`);
  return pb;
}

// ponytail: in-memory per-IP Rate-Limit für die Server-Action; globales Limit nur bei Multi-Instanz nötig.
const unlockAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_UNLOCK_ATTEMPTS = 10;
const UNLOCK_WINDOW_MS = 60 * 60 * 1000;
const MAX_UNLOCK_TRACKED_IPS = 10_000;

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
  const entry = unlockAttempts.get(ip);
  if (!entry) return true;
  if (Date.now() > entry.resetAt) {
    unlockAttempts.delete(ip);
    return true;
  }
  return entry.count < MAX_UNLOCK_ATTEMPTS;
}

export function recordUnlockFailure(ip: string): void {
  const entry = unlockAttempts.get(ip);
  if (!entry || Date.now() > entry.resetAt) {
    // ponytail: Cap statt Alters-Sweeping; reicht, solange die Map unter 10k bleibt.
    if (unlockAttempts.size >= MAX_UNLOCK_TRACKED_IPS) {
      const oldest = unlockAttempts.keys().next().value;
      if (oldest !== undefined) unlockAttempts.delete(oldest);
    }
    unlockAttempts.set(ip, { count: 1, resetAt: Date.now() + UNLOCK_WINDOW_MS });
  } else {
    entry.count++;
  }
}
