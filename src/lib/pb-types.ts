export type Rol = "editor" | "familie";

export interface UserRecord {
  id: string;
  email: string;
  rolle: Rol;
  created: string;
  updated: string;
}

export interface LagerRecord {
  id: string;
  jahr: number;
  titel: string;
  datum_von: string;
  datum_bis: string;
  beschreibung: string;
  youtube_url: string;
  immich_url: string;
  created: string;
  updated: string;
}

export interface DokumentRecord {
  id: string;
  name: string;
  datei: string;
  lager: string;
  sensibel: boolean;
  sort: number;
  collection: "dokumente" | "dokumente_intern";
  created: string;
  updated: string;
}

export interface SeiteRecord {
  id: string;
  slug: string;
  titel: string;
  inhalt: string;
  bilder: string[];
  created: string;
  updated: string;
}

export interface ArchivRecord {
  id: string;
  jahr: number;
  video_url: string;
  fotos_url: string;
  created: string;
  updated: string;
}

export interface SponsorRecord {
  id: string;
  name: string;
  logo: string;
  url: string;
  sort: number;
  created: string;
  updated: string;
}

export interface LinkRecord {
  id: string;
  titel: string;
  url: string;
  sort: number;
  created: string;
  updated: string;
}

export interface KontaktRecord {
  id: string;
  rolle: "Lagerleiter" | "Website";
  name: string;
  sort: number;
  created: string;
  updated: string;
}

export interface EinstellungenRecord {
  id: string;
  hero_video: string;
  hero_poster: string;
  hero_titel: string;
  hero_willkommen: string;
  created: string;
  updated: string;
}

export interface CollectionSchema {
  lager: LagerRecord;
  dokumente: DokumentRecord;
  dokumente_intern: DokumentRecord;
  seiten: SeiteRecord;
  archiv: ArchivRecord;
  sponsoren: SponsorRecord;
  links: LinkRecord;
  kontakte: KontaktRecord;
  einstellungen: EinstellungenRecord;
  users: UserRecord;
}
