import { NextRequest, NextResponse } from "next/server";
import {
  FAMILY_ACCESS_COOKIE,
  familyPocketBase,
  hasFamilyAccess,
} from "@/lib/family-access";
import { pbRequest, PB_URL } from "@/lib/pb";
import type { DokumentRecord } from "@/lib/pb-types";

interface RouteParams {
  params: Promise<{ collection: string; id: string; path: string[] }>;
}

const ALLOWED = new Set(["dokumente", "dokumente_intern"]);

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { collection, id, path } = await params;
  if (!ALLOWED.has(collection)) {
    return new NextResponse("Nicht gefunden", { status: 404 });
  }
  const filename = path.join("/");
  if (!filename) return new NextResponse("Nicht gefunden", { status: 404 });
  const cookieHeader = req.headers.get("cookie") || "";
  let pb = pbRequest();

  if (collection === "dokumente_intern") {
    if (hasFamilyAccess(req.cookies.get(FAMILY_ACCESS_COOKIE)?.value)) {
      try {
        pb = await familyPocketBase();
      } catch {
        return new NextResponse("Familienzugang nicht verfügbar", { status: 503 });
      }
    } else {
      pb = pbRequest(cookieHeader);
    }

    if (!pb.authStore.isValid) {
      return new NextResponse("Familienpasswort erforderlich", {
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
