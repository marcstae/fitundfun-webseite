import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { pbRequest, REVALIDATE_SECRET } from "@/lib/pb";

/** On-Demand-Revalidation nach jedem Save. Geschützt: gültige PB-Session nötig. */
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
    const server = body?.secret && REVALIDATE_SECRET && body.secret === REVALIDATE_SECRET;
    if (!editor && !server) {
      return NextResponse.json({ error: "nicht autorisiert" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "session ungültig" }, { status: 401 });
  }

  const { path } = body;
  if (typeof path === "string" && path.startsWith("/")) {
    revalidatePath(path);
    if (path === "/" || path.startsWith("/lager")) revalidatePath("/lager");
    revalidatePath("/", "layout");
  }

  return NextResponse.json({ ok: true });
}
