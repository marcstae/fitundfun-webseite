/** Zentrale, validierte SITE_URL — wirft nie, fällt auf localhost zurück. */
export function siteUrl(): string {
  const raw = process.env.SITE_URL || "";
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.origin;
    }
  } catch {
    console.error(`fitundfun: SITE_URL "${raw}" ist keine gültige URL — verwende localhost`);
  }
  return "http://localhost:3000";
}
/** Lagerhaus (Ferienheim Albin) – gemeinsam für Lager- und Lagerhaus-Seite. */
export const LAGERHAUS_ADRESSE = "Via Cadruvi Sut 20, 7165 Breil/Brigels";
export const LAGERHAUS_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(`Ferienheim Albin, ${LAGERHAUS_ADRESSE}`);
