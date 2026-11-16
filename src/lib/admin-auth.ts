import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type PocketBase from "pocketbase";
import type { RecordModel } from "pocketbase";
import { pbRequest } from "@/lib/pb";

/**
 * Konto der Sitzung, frisch von PocketBase bestätigt, sonst null. Nie das Modell aus dem Cookie
 * verwenden: Das Auth-Cookie ist nicht httpOnly, sein Inhalt also vom Browser änderbar.
 */
export async function sitzungskonto(pb: PocketBase): Promise<RecordModel | null> {
  if (!pb.authStore.isValid) return null;
  try {
    return (await pb.collection("users").authRefresh()).record;
  } catch {
    return null;
  }
}

/** Lagerleitung mit geändertem Startpasswort: darf ins Cockpit und speichern. */
export function istEditor(konto: RecordModel | null): boolean {
  return konto?.rolle === "editor" && konto.muss_passwort_aendern !== true;
}

export async function requireEditor() {
  const konto = await sitzungskonto(pbRequest((await cookies()).toString()));
  if (!konto) redirect("/login?redirect=/admin");
  if (konto.rolle !== "editor") redirect("/");
  if (konto.muss_passwort_aendern === true) redirect("/admin-einrichtung");

  return {
    id: String(konto.id),
    email: String(konto.email),
  };
}
