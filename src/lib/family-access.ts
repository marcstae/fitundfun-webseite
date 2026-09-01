import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type PocketBase from "pocketbase";
import { pbRequest } from "./pb.ts";

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

export function isFamilyPassword(value: string): boolean {
  return !!familyPassword && safeEqual(value, familyPassword);
}

export function familyAccessCookieValue(): string {
  return createHmac("sha256", familyPassword)
    .update("fitundfun-family-access-v1")
    .digest("base64url");
}

export function hasFamilyAccess(value?: string): boolean {
  return !!familyPassword && !!value && safeEqual(value, familyAccessCookieValue());
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
