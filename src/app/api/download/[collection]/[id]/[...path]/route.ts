import { NextResponse } from "next/server";
import { pbRequest, PB_URL } from "@/lib/pb";
import type { DokumentRecord } from "@/lib/pb-types";

interface RouteParams {
  params: { collection: string; id: string; path: string[] };
}

const ALLOWED = new Set(["dokumente", "dokumente_intern"]);

export async function GET(req: Request, { params }: RouteParams) {
  const { collection, id, path } = params;
  if (!ALLOWED.has(collection)) {
    return new NextResponse("Nicht gefunden", { status: 404 });
  }
  const filename = path.join("/");
  if (!filename) return new NextResponse("Nicht gefunden", { status: 404 });

  const cookieHeader = req.headers.get("cookie") || "";
  const pb = collection === "dokumente_intern" ? pbRequest(cookieHeader) : pbRequest();

  if (collection === "dokumente_intern" && !pb.authStore.isValid) {
    return new NextResponse("Anmeldung erforderlich", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
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

  const extension = rec.datei.toLowerCase().endsWith(".docx") ? ".docx" : ".pdf";
  const downloadName = `${rec.name}${extension}`.replace(/[\\/"\r\n]/g, "_");
  const contentType =
    upstream.headers.get("Content-Type") ||
    (extension === ".docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf");
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${downloadName}"`,
      "Cache-Control": "private, max-age=0",
    },
  });
}
