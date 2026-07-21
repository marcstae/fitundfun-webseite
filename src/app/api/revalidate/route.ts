import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { pbServer, REVALIDATE_SECRET } from "@/lib/pb";

/** On-Demand-Revalidation nach jedem Save. Geschützt: gültige PB-Session nötig. */
export async function POST(req: Request) {
  let authHeader = req.headers.get("authorization") || "";

  const pb = pbServer();
  try {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token) {
      pb.authStore.save(token);
      await pb.collection("users").authRefresh();
    }
    if (!pb.authStore.isValid || !pb.authStore.model) {
      const body = await req.json().catch(() => ({}));
      if (body?.secret && REVALIDATE_SECRET && body.secret === REVALIDATE_SECRET) {
        // Server-to-Server Fallback
      } else {
        return NextResponse.json({ error: "nicht autorisiert" }, { status: 401 });
      }
    }
  } catch {
    return NextResponse.json({ error: "session ungültig" }, { status: 401 });
  }

  const { path } = await req.json().catch(() => ({ path: "/" }));
  if (typeof path === "string" && path.startsWith("/")) {
    revalidatePath(path);
    if (path === "/" || path.startsWith("/lager")) revalidatePath("/lager");
    revalidatePath("/", "layout");
  }

  return NextResponse.json({ ok: true });
}
