import { unstable_cache } from "next/cache";
import { pbServer } from "./pb";
import type {
  ArchivRecord,
  DokumentRecord,
  EinstellungenRecord,
  KontaktRecord,
  LagerRecord,
  LinkRecord,
  SeiteRecord,
  SponsorRecord,
} from "./pb-types";
import { lagerStatus } from "./utils";

const REVALIDATE = 300; // 5 Minuten

/** Aktuelles Lager = höchstes Jahr dessen datum_bis <= 60 Tage zurück, sonst höchstes Jahr. */
export function pickAktuellesLager(lager: LagerRecord[]): LagerRecord | null {
  if (!lager.length) return null;
  const sorted = [...lager].sort((a, b) => a.jahr - b.jahr);
  const now = Date.now();
  const cutoff = now - 60 * 86_400_000;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const l = sorted[i];
    const bis = new Date(l.datum_bis).getTime();
    if (bis >= cutoff) return l;
  }
  return sorted[sorted.length - 1];
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
    } catch {
      // PB nicht erreichbar (z. B. zur Build-Zeit) → leer liefern
      return out;
    }
    out.push(...res.items);
    if (res.items.length < perPage || page >= 1000) break;
    page++;
  }
  return out;
}

export const getLager = unstable_cache(
  async () => listAll<LagerRecord>("lager", "jahr"),
  ["lager"],
  { revalidate: REVALIDATE }
);

export const getArchiv = unstable_cache(
  async () => listAll<ArchivRecord>("archiv", "-jahr"),
  ["archiv"],
  { revalidate: REVALIDATE }
);

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
    } catch {
      return null;
    }
  },
  ["einstellungen"],
  { revalidate: REVALIDATE }
);

export async function getAktuellesLager(): Promise<LagerRecord | null> {
  const all = await getLager();
  return pickAktuellesLager(all);
}

export async function getLagerByJahr(jahr: number): Promise<LagerRecord | null> {
  const all = await getLager();
  return all.find((l) => l.jahr === jahr) ?? null;
}

export async function getDokumenteForLager(
  lagerId: string
): Promise<DokumentRecord[]> {
  const pb = pbServer();
  const out: DokumentRecord[] = [];
  try {
    const pub = await pb.collection("dokumente").getList<DokumentRecord>(1, 500, {
      filter: `lager = "${lagerId}"`,
      sort: "sort,name",
    });
    out.push(...pub.items.map((d) => ({ ...d, sensibel: false, collection: "dokumente" as const })));
  } catch {}
  try {
    const intern = await pb
      .collection("dokumente_intern")
      .getList<DokumentRecord>(1, 500, {
        filter: `lager = "${lagerId}"`,
        sort: "sort,name",
      });
    out.push(
      ...intern.items.map((d) => ({ ...d, sensibel: true, collection: "dokumente_intern" as const }))
    );
  } catch {}
  return out.sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
}

export async function getSeite(slug: string): Promise<SeiteRecord | null> {
  const all = await getSeiten();
  return all.find((s) => s.slug === slug) ?? null;
}

export function isLagerAktiv(l: LagerRecord): boolean {
  return lagerStatus(l.datum_von, l.datum_bis) !== "past";
}
