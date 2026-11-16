import type PocketBase from "pocketbase";
import { unstable_cache } from "next/cache";
import { mitFamilienkonto } from "./family-access";
import { letzteSchneemessung, pickNeustesFotoalbum } from "./utils";
import { pbRequest, pbServer } from "./pb";
import type {
  DokumentRecord,
  FotoalbumRecord,
  EinstellungenRecord,
  KontaktgruppeRecord,
  KontaktRecord,
  LagerRecord,
  LinkRecord,
  SeiteRecord,
} from "./pb-types";

const REVALIDATE = 300; // 5 Minuten

export async function getAktuellesLager(): Promise<LagerRecord | null> {
  const all = await getLager();
  return all.find((lager) => lager.status === "veroeffentlicht") ?? null;
}

async function listAll<T>(collection: string, sort = ""): Promise<T[]> {
  const pb = pbServer();
  const perPage = 500;
  let page = 1;
  const out: T[] = [];
  for (;;) {
    let res;
    try {
      res = await pb.collection(collection).getList<T>(page, perPage, {
        sort,
      });
    } catch (e) {
      console.error(`fitundfun: PB-Abfrage ${collection} fehlgeschlagen`, e);
      // Nur beim Build leer liefern (PB läuft dann nicht). Zur Laufzeit werfen, damit
      // unstable_cache den letzten guten Stand behält statt «leer» für 5 Minuten zu cachen.
      if (process.env.NEXT_PHASE === "phase-production-build") return out;
      throw e;
    }
    out.push(...res.items);
    if (res.items.length < perPage || page >= 1000) break;
    page++;
  }
  return out;
}

export const getLager = unstable_cache(
  async () => listAll<LagerRecord>("lager", "-jahr"),
  ["lager"],
  { revalidate: REVALIDATE }
);

export async function getNeustesFotoalbum(
  authCookie = "",
  familyAccess = false
): Promise<{
  fotoalbum: FotoalbumRecord | null;
  jahr: number | null;
  hasFotoalbum: boolean;
}> {
  const empty = { fotoalbum: null, jahr: null, hasFotoalbum: false };
  const laden = async (pb: PocketBase, reveal: boolean) => {
    const [albums, lager] = await Promise.all([
      pb.collection("fotoalben").getFullList<FotoalbumRecord>(),
      getLager(),
    ]);
    const latest = pickNeustesFotoalbum(albums, lager);
    return {
      fotoalbum: reveal ? latest?.fotoalbum || null : null,
      jahr: latest?.jahr || null,
      hasFotoalbum: !!latest,
    };
  };

  const request = authCookie ? pbRequest(authCookie) : null;
  if (request?.authStore.isValid) {
    try {
      return await laden(request, true);
    } catch (e) {
      // Seit PocketBase 0.42 gibt ein ungültig gewordenes Admin-Token 401: weiter wie ohne Anmeldung.
      if ((e as { status?: number })?.status !== 401) console.error("fitundfun: Fotoalben mit Admin-Cookie fehlgeschlagen", e);
    }
  }

  try {
    return await mitFamilienkonto((pb) => laden(pb, familyAccess));
  } catch (e) {
    console.error("fitundfun: Fotoalben konnten nicht geladen werden", e);
    return empty;
  }
}

export const getLinks = unstable_cache(
  async () => listAll<LinkRecord>("links", "sort"),
  ["links"],
  { revalidate: REVALIDATE }
);

export const getKontaktgruppen = unstable_cache(
  async () =>
    mitFamilienkonto((pb) => pb.collection("kontaktgruppen").getFullList<KontaktgruppeRecord>({ sort: "sort,name" })),
  ["kontaktgruppen"],
  { revalidate: REVALIDATE }
);

// Kontakte sind nicht öffentlich lesbar (geschützte E-Mail/Telefon, Migration 26): lesen über das
// Familienkonto des Servers; was Besucher sehen, entscheidet lib/inhaltsseiten sichtbarerKontakt.
export const getKontakte = unstable_cache(
  async () => mitFamilienkonto((pb) => pb.collection("kontakte").getFullList<KontaktRecord>({ sort: "sort" })),
  ["kontakte"],
  { revalidate: REVALIDATE }
);

export const getSeiten = unstable_cache(
  async () => listAll<SeiteRecord>("seiten", "slug"),
  ["seiten"],
  { revalidate: REVALIDATE }
);

export const getEinstellungen = unstable_cache(
  async (): Promise<EinstellungenRecord | null> => {
    const pb = pbServer();
    try {
      const res = await pb
        .collection("einstellungen")
        .getList<EinstellungenRecord>(1, 1);
      return res.items[0] ?? null;
    } catch (e) {
      console.error("fitundfun: einstellungen-Abfrage fehlgeschlagen", e);
      if (process.env.NEXT_PHASE === "phase-production-build") return null;
      throw e;
    }
  },
  ["einstellungen"],
  { revalidate: REVALIDATE }
);


export async function getLagerByJahr(
  jahr: number,
  authCookie = ""
): Promise<LagerRecord | null> {
  if (authCookie) {
    const authenticated = pbRequest(authCookie);
    if (authenticated.authStore.isValid) {
      try {
        return await authenticated
          .collection("lager")
          .getFirstListItem<LagerRecord>(`jahr = ${jahr}`);
      } catch {
        // Ungültige/abgelaufene Sitzung oder kein sichtbarer Datensatz:
        // mit der öffentlichen Sicht fortfahren.
      }
    }
  }
  const all = await getLager();
  return all.find((l) => l.jahr === jahr) ?? null;
}

interface ProtectedContent {
  documents: DokumentRecord[];
  fotoalbum: FotoalbumRecord | null;
}

interface LagerInhaltResult {
  items: DokumentRecord[];
  hasProtected: boolean;
  fotoalbum: FotoalbumRecord | null;
  hasProtectedPhoto: boolean;
  accessGranted: boolean;
}

async function loadProtectedContent(
  pb: PocketBase,
  recordId: string
): Promise<ProtectedContent> {
  const [documents, albums] = await Promise.all([
    pb.collection("dokumente_intern").getList<DokumentRecord>(1, 500, {
      filter: `lager = "${recordId}"`,
      sort: "sort,name",
    }),
    pb.collection("fotoalben").getList<FotoalbumRecord>(1, 1, {
      filter: `lager = "${recordId}"`,
    }),
  ]);
  return {
    documents: documents.items,
    fotoalbum: albums.items[0] ?? null,
  };
}

async function getDokumenteForRelation(
  recordId: string,
  authCookie = "",
  familyAccess = false
): Promise<LagerInhaltResult> {
  const out: DokumentRecord[] = [];
  // Mit Editor-Sitzung lesen, damit die Entwurfsvorschau auch öffentliche Dokumente zeigt.
  const session = authCookie ? pbRequest(authCookie) : null;
  try {
    const liste = (pb: PocketBase) =>
      pb.collection("dokumente").getList<DokumentRecord>(1, 500, {
        filter: `lager = "${recordId}"`,
        sort: "sort,name",
      });
    // Seit PocketBase 0.42 wird ein ungültig gewordenes Admin-Token (z. B. Passwort anderswo
    // geändert) mit 401 abgewiesen statt als Gast behandelt: dann öffentlich lesen.
    const pub = session?.authStore.isValid
      ? await liste(session).catch(() => liste(pbServer()))
      : await liste(pbServer());
    out.push(
      ...pub.items.map((document) => ({
        ...document,
        sensibel: false,
        collection: "dokumente" as const,
      }))
    );
  } catch (e) {
    console.error("fitundfun: öffentliche Dokumente nicht ladbar", e);
  }

  let protectedContent: ProtectedContent = {
    documents: [],
    fotoalbum: null,
  };
  let protectedLoaded = false;
  let revealProtected = false;

  if (session?.authStore.isValid) {
    try {
      protectedContent = await loadProtectedContent(session, recordId);
      protectedLoaded = true;
      revealProtected = true;
    } catch (e) {
      console.error("fitundfun: geschützte Inhalte mit Admin-Cookie fehlgeschlagen", e);
    }
  }

  if (!protectedLoaded) {
    try {
      protectedContent = await mitFamilienkonto((pb) => loadProtectedContent(pb, recordId));
      protectedLoaded = true;
      revealProtected = familyAccess;
    } catch (e) {
      console.error("fitundfun: Anmeldung des internen Familienkontos fehlgeschlagen — FAMILY_ACCESS_SECRET prüfen", e);
    }
  }

  // Namen geschützter Dokumente sind sichtbar (mit Schloss); die Datei selbst gibt es
  // nur mit Lagerpasswort, sonst führt der Link zur Passwortabfrage.
  out.push(
    ...protectedContent.documents.map((document) => ({
      ...document,
      sensibel: true,
      collection: "dokumente_intern" as const,
    }))
  );

  return {
    items: out.sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)),
    hasProtected: protectedContent.documents.length > 0,
    fotoalbum: revealProtected ? protectedContent.fotoalbum : null,
    hasProtectedPhoto: !!protectedContent.fotoalbum,
    accessGranted: revealProtected,
  };
}

export async function getDokumenteForLager(
  lagerId: string,
  authCookie = "",
  familyAccess = false
): Promise<LagerInhaltResult> {
  return getDokumenteForRelation(lagerId, authCookie, familyAccess);
}

export async function getSeite(slug: string): Promise<SeiteRecord | null> {
  const all = await getSeiten();
  return all.find((s) => s.slug === slug) ?? null;
}

// SLF-Station Val Miez (TUM2, 2191 m) im Skigebiet Brigels, misst alle 30 Minuten. Ein gemeinsamer
// Cache für alle Besuchenden: höchstens eine SLF-Abfrage pro 30 Minuten, und nur wenn jemand die Seite
// öffnet. Schlägt sie fehl, wird geworfen, damit der letzte gute Wert stehen bleibt.
export const getSchneehoehe = unstable_cache(
  async () => {
    const res = await fetch("https://measurement-api.slf.ch/public/api/imis/station/TUM2/measurements", {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`SLF-Abfrage fehlgeschlagen: ${res.status}`);
    return letzteSchneemessung(await res.json());
  },
  // v2: zwischengespeichert wird der Messwert samt Messzeit, das Alter prüft die Lagerseite.
  ["schneehoehe-tum2-v2"],
  { revalidate: 1800 }
);
