"use server";

import { cookies, headers } from "next/headers";
import type { UnlockState } from "@/components/family-unlock";
import {
  FAMILY_ACCESS_COOKIE,
  FAMILY_ACCESS_MAX_AGE,
  clientIp,
  familyAccessCookieValue,
  isFamilyPassword,
  recordUnlockFailure,
  unlockAttemptAllowed,
} from "@/lib/family-access";

/**
 * Lagerpasswort prüfen und den Zugang per Cookie auf dem Gerät speichern
 * (geschützte Dokumente, Fotoalbum, Kontaktangaben).
 */
export async function unlockFamilyAccess(_state: UnlockState, formData: FormData): Promise<UnlockState> {
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
