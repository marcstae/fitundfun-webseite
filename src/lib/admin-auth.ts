import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { pbRequest } from "@/lib/pb";

export async function requireEditor() {
  const pb = pbRequest((await cookies()).toString());
  let model: Record<string, unknown> | null = null;

  try {
    if (!pb.authStore.isValid) throw new Error("Sitzung fehlt");
    const result = await pb.collection("users").authRefresh();
    model = result.record as unknown as Record<string, unknown>;
  } catch {
    redirect("/login?redirect=/admin");
  }

  if (model.rolle !== "editor") redirect("/");
  if (model.muss_passwort_aendern === true) redirect("/admin-einrichtung");

  return {
    id: String(model.id),
    email: String(model.email),
  };
}
