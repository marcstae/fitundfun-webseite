"use server";

import { cookies, headers } from "next/headers";
import type { UnlockState } from "@/components/family-unlock";
import {
  FAMILY_ACCESS_COOKIE,
  clientIp,
  familyCookieOptionen,
  freischaltCookie,
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
  let cookieWert: string | null;
  try {
    cookieWert = typeof password === "string" ? await freischaltCookie(password) : null;
  } catch (e) {
    releaseUnlockAttempt(ip);
    console.error("fitundfun: Lagerpasswort konnte nicht geprüft werden", e);
    return { fehler: "technisch" };
  }
  if (!cookieWert) return { fehler: "falsch" };
  releaseUnlockAttempt(ip);

  (await cookies()).set(FAMILY_ACCESS_COOKIE, cookieWert, familyCookieOptionen(headerStore.get("x-forwarded-proto")));
  return { ok: true };
}
