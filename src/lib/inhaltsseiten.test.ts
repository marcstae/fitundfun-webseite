import { test } from "node:test";
import assert from "node:assert/strict";
import { kontaktInhalt, LAGERHAUS_STANDARD, lagerhausInhalt, mapsUrl, sichtbarerKontakt } from "./inhaltsseiten.ts";
import type { KontaktRecord } from "./pb-types.ts";
import { akzentfarbe, kontrastZuWeiss } from "./utils.ts";

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
  const gruppen = kontaktInhalt({ gruppen: { Website: "Technik", Kueche: "" } }).gruppen;
  assert.equal(gruppen.Website, "Technik");
  assert.equal(gruppen.Kueche, "Küche"); // leer → Standard
});

test("sichtbarerKontakt: geschützte Angaben nur mit Lagerpasswort", () => {
  const kontakt = {
    id: "k1", rolle: "Skilehrer", name: "Muster", sort: 1, created: "", updated: "",
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

test("akzentfarbe: nur gültige Farben mit lesbarer weisser Schrift", () => {
  assert.ok(Math.abs(kontrastZuWeiss("#2563eb") - 5.17) < 0.01);
  assert.equal(akzentfarbe("#2563EB"), "#2563eb");
  assert.equal(akzentfarbe("#ffeb3b"), null); // Gelb: weisse Schrift unlesbar
  assert.equal(akzentfarbe("red; background: url(x)"), null);
  assert.equal(akzentfarbe(undefined), null);
});
