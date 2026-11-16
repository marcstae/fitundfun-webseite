"use server";

import { cookies, headers } from "next/headers";
import type { UnlockState } from "@/components/family-unlock";
import {
  FAMILY_ACCESS_COOKIE,
  FAMILY_ACCESS_MAX_AGE,
  clientIp,
  familyAccessCookieValue,
  istLagerpasswort,
  recordUnlockFailure,
  releaseUnlockAttempt,
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
  // Den Versuch vor der asynchronen Prüfung zählen: Sonst kämen gleichzeitige Anfragen alle durch,
  // bevor der erste Fehlversuch gezählt ist. Freigegeben wird er auf jedem Weg ausser «falsch».
  recordUnlockFailure(ip);

  const password = formData.get("password");
  let cookieWert: string;
  try {
    if (typeof password !== "string" || !(await istLagerpasswort(password))) return { fehler: "falsch" };
    cookieWert = await familyAccessCookieValue();
  } catch (e) {
    releaseUnlockAttempt(ip);
    console.error("fitundfun: Lagerpasswort konnte nicht geprüft werden", e);
    return { fehler: "technisch" };
  }
  releaseUnlockAttempt(ip);

  (await cookies()).set(FAMILY_ACCESS_COOKIE, cookieWert, {
    httpOnly: true,
    maxAge: FAMILY_ACCESS_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: headerStore.get("x-forwarded-proto") === "https",
  });
  return { ok: true };
}
