"use server";

import { cookies } from "next/headers";
import { hashFamilyPassword } from "@/lib/family-access";
import { pbRequest } from "@/lib/pb";
import type { FamilienzugangRecord } from "@/lib/pb-types";

export async function changeFamilyPassword(
  password: string,
  confirmation: string
): Promise<{ ok: boolean; message: string }> {
  // Bewusst keine Längen- oder Zeichenvorgaben: Die Lagerleitung wählt ein Passwort, das
  // sich Familien merken können. Schutz gegen Durchprobieren bietet das Versuchslimit.
  if (!password) {
    return { ok: false, message: "Bitte ein Lagerpasswort eingeben." };
  }
  if (password !== confirmation) {
    return { ok: false, message: "Die Passwörter stimmen nicht überein." };
  }

  const pb = pbRequest((await cookies()).toString());
  try {
    if (!pb.authStore.isValid) throw new Error("Keine Sitzung");
    const auth = await pb.collection("users").authRefresh();
    if (
      auth.record.rolle !== "editor" ||
      auth.record.muss_passwort_aendern === true
    ) {
      throw new Error("Keine Berechtigung");
    }

    const result = await pb
      .collection("familienzugang")
      .getList<FamilienzugangRecord>(1, 1);
    const current = result.items[0];
    const data = {
      password_hash: await hashFamilyPassword(password),
      cookie_version: (current?.cookie_version || 0) + 1,
    };
    if (current) {
      await pb.collection("familienzugang").update(current.id, data);
    } else {
      await pb.collection("familienzugang").create(data);
    }
    return {
      ok: true,
      message: "Lagerpasswort gespeichert. Bestehende Zugänge wurden abgemeldet.",
    };
  } catch {
    return { ok: false, message: "Das Lagerpasswort konnte nicht gespeichert werden." };
  }
}
