/** Backups im Cockpit: Antwort der PocketBase-Hooks (pb/pb_hooks/backup.pb.js) und Zeitplan als Cron. */

export interface BackupDatei {
  name: string;
  groesse: number;
  datum: string;
}

export interface BackupStand {
  backups: BackupDatei[];
  cron: string;
  behalten: number;
  ort: string;
  laeuft: boolean;
  gestartet: string;
}

export type Rhythmus = "aus" | "taeglich" | "woechentlich";
export type Zeitplan = { rhythmus: Rhythmus; uhrzeit: string; wochentag: number };

/** Index = Cron-Wochentag (0 = Sonntag). */
export const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

/** Liest nur, was das Cockpit selbst schreibt; anderes (z. B. von Hand in PocketBase gesetzt) ergibt null. */
export function zeitplanAusCron(cron: string): Zeitplan | null {
  if (!cron) return { rhythmus: "aus", uhrzeit: "03:00", wochentag: 0 };
  const teile = /^(\d{1,2}) (\d{1,2}) \* \* (\*|[0-6])$/.exec(cron);
  if (!teile || Number(teile[1]) > 59 || Number(teile[2]) > 23) return null;
  const [, minute, stunde, tag] = teile;
  return {
    rhythmus: tag === "*" ? "taeglich" : "woechentlich",
    uhrzeit: `${stunde.padStart(2, "0")}:${minute.padStart(2, "0")}`,
    wochentag: tag === "*" ? 0 : Number(tag),
  };
}

export function cronAusZeitplan(zeitplan: Zeitplan): string {
  if (zeitplan.rhythmus === "aus") return "";
  const [stunde, minute] = zeitplan.uhrzeit.split(":").map(Number);
  return `${minute} ${stunde} * * ${zeitplan.rhythmus === "woechentlich" ? zeitplan.wochentag : "*"}`;
}

/** Herkunft aus dem Dateinamen, den PocketBase bzw. die Hooks vergeben. */
export function backupArt(name: string): string {
  if (name.startsWith("@auto_")) return "Automatisch";
  if (name.startsWith("manuell_")) return "Manuell";
  if (name.startsWith("vor_wiederherstellung_")) return "Vor Wiederherstellung";
  if (name.startsWith("hochgeladen_")) return "Hochgeladen";
  return "Andere";
}

export function groesseText(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return mb >= 1024
    ? `${(mb / 1024).toLocaleString("de-CH", { maximumFractionDigits: 1 })} GB`
    : `${mb.toLocaleString("de-CH", { maximumFractionDigits: 1 })} MB`;
}
