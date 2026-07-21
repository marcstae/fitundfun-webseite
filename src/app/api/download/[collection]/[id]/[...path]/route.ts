import { NextResponse } from "next/server";
import { pbServer, PB_URL } from "@/lib/pb";
import type { DokumentRecord } from "@/lib/pb-types";

interface RouteParams {
  params: { collection: string; id: string; path: string[] };
}

const ALLOWED = new Set(["dokumente", "dokumente_intern"]);

export async function GET(_req: Request, { params }: RouteParams) {
  const { collection, id, path } = params;
  if (!ALLOWED.has(collection)) {
    return new NextResponse("Nicht gefunden", { status: 404 });
  }
  const filename = path.join("/");
  if (!filename) return new NextResponse("Nicht gefunden", { status: 404 });

  const pb = pbServer();

  // Sensible Dokumente nur für eingeloggte Familie/Editor.
  if (collection === "dokumente_intern") {
    const cookie = _req.headers.get("cookie") || "";
    if (cookie) {
      const m = cookie.match(/pb_auth=([^;]+)/);
      if (m) {
        try {
          pb.authStore.loadFromCookie(decodeURIComponent(m[1]));
          await pb.collection("users").authRefresh();
        } catch {
          pb.authStore.clear();
        }
      }
    }
    if (!pb.authStore.isValid) {
      return new NextResponse("Anmeldung erforderlich", {
        status: 401,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  }

  // Record abrufen, um den echten Dateinamen + Namen zu validieren.
  let rec: DokumentRecord | null = null;
  try {
    rec = await pb.collection(collection).getOne<DokumentRecord>(id);
  } catch {
    return new NextResponse("Nicht gefunden", { status: 404 });
  }
  if (!rec || rec.datei !== filename) {
    return new NextResponse("Nicht gefunden", { status: 404 });
  }

  // Datei von PocketBase streamen (proxy, damit PB-URL/token nicht exponiert).
  let token = "";
  try {
    token = await pb.files.getToken();
  } catch {
    token = "";
  }
  const url = `${PB_URL}/api/files/${collection}/${id}/${filename}${token ? `?token=${token}` : ""}`;
  const upstream = await fetch(url);
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Datei nicht verfügbar", { status: 502 });
  }

  const downloadName = `${rec.name}.pdf`;
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${downloadName.replace(/"/g, "_")}"`,
      "Cache-Control": "private, max-age=0",
    },
  });
}
