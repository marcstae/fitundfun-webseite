import type PocketBase from "pocketbase";
import { NextRequest, NextResponse } from "next/server";
import {
  FAMILY_ACCESS_COOKIE,
  familyPocketBase,
  hasFamilyAccess,
} from "@/lib/family-access";
import { pbRequest, PB_INTERNAL_URL } from "@/lib/pb";
import type { DokumentRecord, LagerRecord } from "@/lib/pb-types";
import { contentDisposition } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ collection: string; id: string; path: string[] }>;
}

const ALLOWED = new Set(["dokumente", "dokumente_intern"]);

const notFound = () => new NextResponse("Nicht gefunden", { status: 404 });

// Der Dateiname im Pfad ist nur Kosmetik: Ein verschickter Link bleibt gültig,
// auch wenn die Lagerleitung später eine überarbeitete Fassung hochlädt.
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { collection, id } = await params;
  if (!ALLOWED.has(collection)) return notFound();

  // Editor-Sitzung zuerst (auch für Entwürfe), danach der Familienzugang.
  const session = pbRequest(req.headers.get("cookie") || "");
  const readers: (() => Promise<PocketBase>)[] = [];
  if (session.authStore.isValid || collection === "dokumente") readers.push(async () => session);
  if (
    collection === "dokumente_intern" &&
    (await hasFamilyAccess(req.cookies.get(FAMILY_ACCESS_COOKIE)?.value))
  ) {
    readers.push(familyPocketBase);
  }

  for (const reader of readers) {
    let pb: PocketBase;
    let record: DokumentRecord;
    try {
      pb = await reader();
      record = await pb.collection(collection).getOne<DokumentRecord>(id);
    } catch {
      continue;
    }
    return stream(pb, collection, record);
  }

  return collection === "dokumente_intern" ? familyGate(id, req.nextUrl.pathname) : notFound();
}

/** Ohne Familienzugang zur Passwortabfrage des Lagers; danach geht es direkt zur Datei weiter. */
async function familyGate(id: string, pathname: string) {
  try {
    const pb = await familyPocketBase();
    const record = await pb
      .collection("dokumente_intern")
      .getOne<DokumentRecord & { expand?: { lager?: LagerRecord } }>(id, { expand: "lager" });
    const jahr = record.expand?.lager?.jahr;
    if (jahr) {
      return new NextResponse(null, {
        status: 303,
        headers: { Location: `/lager/${jahr}?weiter=${encodeURIComponent(pathname)}#dokumente` },
      });
    }
  } catch {
    // Unbekanntes oder nicht veröffentlichtes Dokument.
  }
  return notFound();
}

async function stream(pb: PocketBase, collection: string, record: DokumentRecord) {
  // Datei von PocketBase durchreichen, damit PB-URL und Token nicht beim Browser landen.
  let token = "";
  try {
    token = await pb.files.getToken();
  } catch {
    token = "";
  }
  const url = `${PB_INTERNAL_URL}/api/files/${collection}/${record.id}/${encodeURIComponent(record.datei)}${token ? `?token=${token}` : ""}`;
  const upstream = await fetch(url);
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Datei nicht verfügbar", { status: 502 });
  }

  const extension = record.datei.toLowerCase().endsWith(".docx") ? ".docx" : ".pdf";
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ||
        (extension === ".docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/pdf"),
      "Content-Disposition": contentDisposition(`${record.name}${extension}`),
      "Cache-Control": "private, max-age=0",
    },
  });
}
