import type PocketBase from "pocketbase";
import { unstable_cache } from "next/cache";
import { familyPocketBase } from "./family-access";
import { pickNeustesFotoalbum } from "./utils";
import { pbRequest, pbServer } from "./pb";
import type {
  DokumentRecord,
  FotoalbumRecord,
  EinstellungenRecord,
  KontaktRecord,
  LagerRecord,
  LinkRecord,
  SeiteRecord,
  SponsorRecord,
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
      // PB nicht erreichbar (z. B. zur Build-Zeit) → leer liefern
      console.error(`fitundfun: PBS-Abfrage ${collection} fehlgeschlagen`, e);
      return out;
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
  const request = authCookie ? pbRequest(authCookie) : null;
  let authenticated: PocketBase;
  let reveal = false;

  if (request?.authStore.isValid) {
    authenticated = request;
    reveal = true;
  } else {
    try {
      authenticated = await familyPocketBase();
      reveal = familyAccess;
    } catch (e) {
      console.error("fitundfun: Fotoalbum-Zugriff fehlgeschlagen", e);
      return empty;
    }
  }

  try {
    const [albums, lager] = await Promise.all([
      authenticated.collection("fotoalben").getFullList<FotoalbumRecord>(),
      getLager(),
    ]);
    const latest = pickNeustesFotoalbum(albums, lager);

    return {
      fotoalbum: reveal ? latest?.fotoalbum || null : null,
      jahr: latest?.jahr || null,
      hasFotoalbum: !!latest,
    };
  } catch (e) {
    console.error("fitundfun: Fotoalben konnten nicht geladen werden", e);
    return empty;
  }
}

export const getSponsoren = unstable_cache(
  async () => listAll<SponsorRecord>("sponsoren", "sort"),
  ["sponsoren"],
  { revalidate: REVALIDATE }
);

export const getLinks = unstable_cache(
  async () => listAll<LinkRecord>("links", "sort"),
  ["links"],
  { revalidate: REVALIDATE }
);

export const getKontakte = unstable_cache(
  async () => listAll<KontaktRecord>("kontakte", "sort"),
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
      return null;
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
  try {
    const pub = await pbServer().collection("dokumente").getList<DokumentRecord>(1, 500, {
      filter: `lager = "${recordId}"`,
      sort: "sort,name",
    });
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

  if (authCookie) {
    const authenticated = pbRequest(authCookie);
    if (authenticated.authStore.isValid) {
      try {
        protectedContent = await loadProtectedContent(
          authenticated,
          recordId
        );
        protectedLoaded = true;
        revealProtected = true;
      } catch (e) {
        console.error("fitundfun: geschützte Inhalte mit Admin-Cookie fehlgeschlagen", e);
      }
    }
  }

  if (!protectedLoaded) {
    try {
      const authenticated = await familyPocketBase();
      protectedContent = await loadProtectedContent(
        authenticated,
        recordId
      );
      protectedLoaded = true;
      revealProtected = familyAccess;
    } catch (e) {
      console.error("fitundfun: Familienzugang-Auth fehlgeschlagen — FAMILY_ACCESS_PASSWORD prüfen", e);
    }
  }

  if (revealProtected) {
    out.push(
      ...protectedContent.documents.map((document) => ({
        ...document,
        sensibel: true,
        collection: "dokumente_intern" as const,
      }))
    );
  }

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
