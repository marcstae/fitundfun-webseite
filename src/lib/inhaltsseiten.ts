import type { KontaktRecord } from "./pb-types.ts";
import { isValidHttpUrl } from "./utils.ts";

/**
 * Inhalte von Lagerhaus- und Kontaktseite, im Cockpit unter «Inhaltsseiten» bearbeitbar
 * (seiten.daten). Die Standardwerte sind die bisherigen Texte: Solange nichts gespeichert
 * ist, sieht die Website gleich aus wie vorher.
 */

/** Auswahl der Symbole für Einträge; die Zuordnung zu den Icons steht in components/inhalt-icons. */
export const ICONS = {
  bett: "Bett",
  schuhe: "Hausschuhe",
  essen: "Essen",
  mond: "Nachtruhe",
  auto: "Anreise",
  spiel: "Spiele",
  rucksack: "Rucksack",
  ski: "Ski & Berge",
  schnee: "Schnee",
  haus: "Haus",
  uhr: "Uhrzeit",
  dusche: "Dusche",
  wlan: "WLAN",
  musik: "Musik",
  sonne: "Draussen",
  info: "Info",
} as const;
export type IconKey = keyof typeof ICONS;
const ICON_KEYS = Object.keys(ICONS) as IconKey[];

export type Eintrag = { icon: IconKey; titel: string; text: string };

export type LagerhausInhalt = {
  name: string;
  adresse: string;
  website: string;
  fakten: Eintrag[];
  infosTitel: string;
  infos: Eintrag[];
  hinweis: string;
};

export const LAGERHAUS_STANDARD: LagerhausInhalt = {
  name: "Ferienheim Albin",
  adresse: "Via Cadruvi Sut 20, 7165 Breil/Brigels",
  website: "https://www.ferienheim-albin.ch/",
  fakten: [
    { icon: "bett", titel: "Bettzeug vorhanden", text: "Kein Bettanzug oder Schlafsack nötig" },
    { icon: "schuhe", titel: "Hausschuhe mitnehmen", text: "Im Haus Pflicht; Turnschuhe sind auch okay" },
    { icon: "essen", titel: "3 Mahlzeiten", text: "In der Lagerpauschale inbegriffen" },
    { icon: "mond", titel: "Ab 22 Uhr", text: "Nachtruhe, ausser im Aufenthaltsraum und Keller" },
  ],
  infosTitel: "Gut zu wissen fürs Lager",
  infos: [
    {
      icon: "auto",
      titel: "Ankommen & parkieren",
      text: "Individuelle Anreise am Samstag, Hausbezug ab 16 Uhr. Zum Ausladen kurz vor dem Haus halten, danach auf dem Gemeindeparkplatz beim Restaurant Tödi parkieren.",
    },
    {
      icon: "essen",
      titel: "Lunch für die Piste",
      text: "Am Vorabend bei der Küche anmelden und einen Tagesrucksack mitbringen. Tee steht immer bereit, die Kaffeemaschine ist gratis nutzbar.",
    },
    {
      icon: "bett",
      titel: "Zusammen im Haus",
      text: "Essen und Trinken gehören in die Gemeinschaftsräume. Im ganzen Haus und auf den Balkonen gilt Rauchverbot. Zimmerwechsel bitte mit der Lagerleitung absprechen.",
    },
    {
      icon: "spiel",
      titel: "Für die Lagerabende",
      text: "Spiele, Bücher oder ein Musikinstrument sind willkommen. Für Tischtennis eigene Schläger und Bälle mitbringen; Beamer und Soundanlage sind vorhanden.",
    },
  ],
  hinweis: "Stand: Lagerunterlagen 2026. Für künftige Lager gelten die jeweiligen aktuellen Lagerinfos.",
};

/** Bisherige Standardtexte der Seitenspalten titel und inhalt. */
export const LAGERHAUS_TITEL = "Unser Lagerhaus";
export const LAGERHAUS_EINLEITUNG =
  "<p>Das Ferienheim Albin in Brigels ist unser Zuhause während der Lagerwoche. Hier essen wir gemeinsam und verbringen die Abende mit Spielen und Lagerprogramm.</p>";

export const KONTAKT_TITEL = "Kontakt";
export const KONTAKT_EINLEITUNG = "<p>Fragen zum Lager oder zur Website beantworten wir gerne per E-Mail.</p>";

function objekt(daten: unknown): Record<string, unknown> {
  return daten && typeof daten === "object" && !Array.isArray(daten) ? (daten as Record<string, unknown>) : {};
}

/** Gespeicherter Text; fehlt das Feld, gilt der Standard. Ein leerer Text bleibt leer. */
function text(wert: unknown, standard: string): string {
  return typeof wert === "string" ? wert.trim() : standard;
}

function eintraege(wert: unknown, standard: Eintrag[]): Eintrag[] {
  if (!Array.isArray(wert)) return standard;
  return wert.flatMap((roh) => {
    const e = objekt(roh);
    const titel = text(e.titel, "");
    const beschreibung = text(e.text, "");
    if (!titel && !beschreibung) return [];
    const icon = ICON_KEYS.includes(e.icon as IconKey) ? (e.icon as IconKey) : "info";
    return [{ icon, titel, text: beschreibung }];
  });
}

/** Gespeicherte Lagerhaus-Daten prüfen und mit den Standardwerten ergänzen. */
export function lagerhausInhalt(daten: unknown): LagerhausInhalt {
  const d = objekt(daten);
  const S = LAGERHAUS_STANDARD;
  const website = text(d.website, S.website);
  return {
    // Name, Adresse und Abschnittstitel dürfen nicht leer sein.
    name: text(d.name, "") || S.name,
    adresse: text(d.adresse, "") || S.adresse,
    website: isValidHttpUrl(website) ? website : "",
    fakten: eintraege(d.fakten, S.fakten),
    infosTitel: text(d.infosTitel, "") || S.infosTitel,
    infos: eintraege(d.infos, S.infos),
    hinweis: text(d.hinweis, S.hinweis),
  };
}

/**
 * Was Besucherinnen und Besucher von einem Kontakt sehen dürfen. Geschützte E-Mail und
 * Telefonnummer werden ohne Lagerpasswort entfernt, nicht nur versteckt.
 */
export function sichtbarerKontakt(kontakt: KontaktRecord, zugang: boolean) {
  const email = kontakt.email?.trim() || "";
  const telefon = kontakt.telefon?.trim() || "";
  const emailFrei = !kontakt.email_geschuetzt || zugang;
  const telefonFrei = !kontakt.telefon_geschuetzt || zugang;
  return {
    id: kontakt.id,
    gruppe: kontakt.gruppe,
    name: kontakt.name,
    email: emailFrei ? email : "",
    telefon: telefonFrei ? telefon : "",
    emailGesperrt: !!email && !emailFrei,
    telefonGesperrt: !!telefon && !telefonFrei,
  };
}

/** Bereiche im Cockpit-Tab «Inhaltsseiten» (Reihenfolge = Navigation; der erste öffnet zuerst). */
export const INHALTSSEITEN_BEREICHE = [
  { key: "kontakt", label: "Kontakt", text: "Text der Kontaktseite, Kontaktpersonen und Gruppen.", seite: "/kontakt" },
  { key: "links", label: "Nützliche Links", text: "Erscheinen auf jeder Lagerseite unter «Nützliche Links».", seite: null },
  { key: "lagerhaus", label: "Lagerhaus", text: "Kopfbild, Haus, Adresse, Kurzfakten und Infos fürs Lager.", seite: "/lagerhaus" },
] as const;

/** Google-Maps-Suche nach Haus und Adresse (für Lagerhaus- und Lagerseiten). */
export function mapsUrl({ name, adresse }: Pick<LagerhausInhalt, "name" | "adresse">): string {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${name}, ${adresse}`);
}
