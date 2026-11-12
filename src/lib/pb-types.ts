export type Rol = "editor" | "familie";

export interface UserRecord {
  id: string;
  email: string;
  rolle: Rol;
  created: string;
  updated: string;
}

export type LagerPublikationsstatus =
  | "entwurf"
  | "veroeffentlicht"
  | "archiviert";

export interface LagerRecord {
  id: string;
  jahr: number;
  titel: string;
  datum_von: string;
  datum_bis: string;
  beschreibung: string;
  youtube_url: string;
  teilnehmer: number | null;
  aktivitaeten: string[] | null;
  status: LagerPublikationsstatus;
  quelle_url: string;
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

export interface FotoalbumRecord {
  id: string;
  lager: string;
  url: string;
  created: string;
  updated: string;
}

export interface SeiteRecord {
  id: string;
  slug: string;
  titel: string;
  inhalt: string;
  bilder: string[];
  /** Bausteine der Inhaltsseiten, geprüft über lib/inhaltsseiten. */
  daten?: unknown;
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

export interface KontaktgruppeRecord {
  id: string;
  name: string;
  sort: number;
}

export interface KontaktRecord {
  id: string;
  /** Relation auf kontaktgruppen (Migration 28). */
  gruppe: string;
  /** Altwert der früheren festen Gruppen; nicht mehr verwendet. */
  rolle?: string;
  name: string;
  email: string;
  telefon?: string;
  /** true = nur mit Lagerpasswort sichtbar */
  email_geschuetzt?: boolean;
  telefon_geschuetzt?: boolean;
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
  /** #rrggbb; leer = Standard-Eisblau. */
  akzentfarbe?: string;
  /** #rrggbb für dunklen Grund; leer = Standard-Signalorange. */
  akzentfarbe_dunkel?: string;
  created: string;
  updated: string;
}

export interface FamilienzugangRecord {
  id: string;
  password_hash: string;
  /** Lesbar für eingeloggte Admins; leer, wenn vor Migration 24 gesetzt. */
  passwort?: string;
  cookie_version: number;
  created: string;
  updated: string;
}

export interface CollectionSchema {
  lager: LagerRecord;
  dokumente: DokumentRecord;
  dokumente_intern: DokumentRecord;
  fotoalben: FotoalbumRecord;
  seiten: SeiteRecord;
  links: LinkRecord;
  kontakte: KontaktRecord;
  einstellungen: EinstellungenRecord;
  familienzugang: FamilienzugangRecord;
  users: UserRecord;
}
