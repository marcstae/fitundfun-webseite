import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/family-access";
import { pbRequest, REVALIDATE_SECRET } from "@/lib/pb";

/**
 * Erneuert nach jedem Speichern die ganze Website: Das Root-Layout umfasst alle Seiten, einzelne
 * Pfade braucht es daneben nicht. Nur für die Lagerleitung oder mit dem Server-Secret (scripts/deploy.sh).
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const body = await req.json().catch(() => ({}));

  // Request-scoped Client — niemals den geteilten Server-AuthStore mutieren.
  const pb = pbRequest();
  try {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token) {
      pb.authStore.save(token);
      await pb.collection("users").authRefresh();
    }
    const model = pb.authStore.model as Record<string, unknown> | null;
    const editor =
      pb.authStore.isValid &&
      model?.rolle === "editor" &&
      model.muss_passwort_aendern !== true;
    const secret: unknown = body?.secret;
    const server =
      typeof secret === "string" && !!secret && !!REVALIDATE_SECRET && safeEqual(secret, REVALIDATE_SECRET);
    if (!editor && !server) {
      return NextResponse.json({ error: "nicht autorisiert" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "session ungültig" }, { status: 401 });
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
