import { test } from "node:test";
import assert from "node:assert/strict";
import { LAGERHAUS_STANDARD, lagerhausInhalt, mapsUrl, NOTFALL_STANDARD, notfallKontakt, sichtbarerKontakt } from "./inhaltsseiten.ts";
import type { KontaktRecord } from "./pb-types.ts";
import { AKZENT_DUNKEL_STANDARD, akzentfarbe, DUNKLER_GRUND, kontrast } from "./utils.ts";

test("lagerhausInhalt: ohne Daten die bisherigen Texte, gespeicherte Werte geprüft", () => {
  assert.deepEqual(lagerhausInhalt(null), LAGERHAUS_STANDARD);
  const inhalt = lagerhausInhalt({
    name: "  ",
    website: "javascript:alert(1)",
    fakten: [{ icon: "toString", titel: "Neu", text: "" }, { icon: "ski", titel: "", text: "" }, "kaputt"],
    infos: [],
    hinweis: "",
  });
  assert.equal(inhalt.name, LAGERHAUS_STANDARD.name); // leer → Standard
  assert.equal(inhalt.website, ""); // ungültiger Link → kein Knopf
  assert.deepEqual(inhalt.fakten, [{ icon: "info", titel: "Neu", text: "" }]); // leere und kaputte Einträge weg
  assert.deepEqual(inhalt.infos, []); // bewusst geleert → Abschnitt verschwindet
  assert.equal(inhalt.hinweis, "");
  assert.match(mapsUrl(inhalt), /query=Ferienheim%20Albin%2C%20Via%20Cadruvi/);
});

test("sichtbarerKontakt: geschützte Angaben nur mit Lagerpasswort", () => {
  const kontakt = {
    id: "k1", gruppe: "g1", name: "Muster", sort: 1, created: "", updated: "",
    email: "a@b.ch", email_geschuetzt: false, telefon: "079 000 00 00", telefon_geschuetzt: true,
  } as KontaktRecord;
  const ohne = sichtbarerKontakt(kontakt, false);
  assert.equal(ohne.email, "a@b.ch");
  assert.equal(ohne.telefon, ""); // nicht nur versteckt, sondern entfernt
  assert.equal(ohne.telefonGesperrt, true);
  const mit = sichtbarerKontakt(kontakt, true);
  assert.equal(mit.telefon, "079 000 00 00");
  assert.equal(mit.telefonGesperrt, false);
  // Ohne Nummer gibt es auch nichts Gesperrtes anzuzeigen.
  assert.equal(sichtbarerKontakt({ ...kontakt, telefon: "" }, false).telefonGesperrt, false);
});

test("akzentfarbe: nur gültige Farben, die auf ihrem Grund lesbar sind", () => {
  assert.ok(Math.abs(kontrast("#2563eb", "#ffffff") - 5.17) < 0.01);
  assert.equal(kontrast("#ffffff", "#2563eb"), kontrast("#2563eb", "#ffffff")); // Reihenfolge egal
  assert.equal(akzentfarbe("#2563EB"), "#2563eb");
  assert.equal(akzentfarbe("#ffeb3b"), null); // Gelb: weisse Schrift unlesbar
  assert.equal(akzentfarbe("red; background: url(x)"), null);
  assert.equal(akzentfarbe(undefined), null);
  // Orange auf Nachtblau: Standard und Gelb lesbar, Dunkelrot nicht.
  assert.equal(akzentfarbe(AKZENT_DUNKEL_STANDARD, DUNKLER_GRUND), AKZENT_DUNKEL_STANDARD);
  assert.equal(akzentfarbe("#ffeb3b", DUNKLER_GRUND), "#ffeb3b");
  assert.equal(akzentfarbe("#8b0000", DUNKLER_GRUND), null);
});

test("notfallKontakt: ohne Daten die bisherige Pistenrettung, gespeicherte Nummer geprüft", () => {
  assert.deepEqual(notfallKontakt(null), NOTFALL_STANDARD);
  assert.deepEqual(notfallKontakt({ andere: 1 }), NOTFALL_STANDARD);
  assert.deepEqual(notfallKontakt({ notfall: { name: " Rettung ", telefon: " 081 123 45 67 " } }), { name: "Rettung", telefon: "081 123 45 67" });
  assert.equal(notfallKontakt({ notfall: { name: "", telefon: "+41 81 920 14 34" } }).name, NOTFALL_STANDARD.name); // leer → Standard
  assert.equal(notfallKontakt({ notfall: { telefon: "" } }).telefon, ""); // bewusst geleert → keine Karte
  assert.equal(notfallKontakt({ notfall: { telefon: "javascript:alert(1)" } }).telefon, ""); // ungültig → keine Karte
  assert.equal(notfallKontakt({ notfall: { telefon: "12" } }).telefon, "");
});
