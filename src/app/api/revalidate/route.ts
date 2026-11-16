import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { istEditor, sitzungskonto } from "@/lib/admin-auth";
import { safeEqual } from "@/lib/family-access";
import { pbRequest, REVALIDATE_SECRET } from "@/lib/pb";

/**
 * Erneuert nach jedem Speichern die ganze Website: Das Root-Layout umfasst alle Seiten, einzelne
 * Pfade braucht es daneben nicht. Nur für die Lagerleitung oder mit dem Server-Secret (scripts/deploy.sh).
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const body = await req.json().catch(() => ({}));

  const secret: unknown = body?.secret;
  const server =
    typeof secret === "string" && !!secret && !!REVALIDATE_SECRET && safeEqual(secret, REVALIDATE_SECRET);
  if (!server) {
    // Request-scoped Client — niemals den geteilten Server-AuthStore mutieren.
    const pb = pbRequest();
    pb.authStore.save(authHeader.replace(/^Bearer\s+/i, "").trim());
    if (!istEditor(await sitzungskonto(pb))) {
      return NextResponse.json({ error: "nicht autorisiert" }, { status: 401 });
    }
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
