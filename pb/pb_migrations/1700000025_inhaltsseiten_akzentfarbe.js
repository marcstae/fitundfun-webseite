/// <reference path="../pb_data/types.d.ts" />
// Nur neue Felder, bestehende Inhalte bleiben unverändert:
// - seiten.daten: bearbeitbare Bausteine von Lagerhaus- und Kontaktseite (leer = bisherige Texte)
// - einstellungen.akzentfarbe: Akzentfarbe der Website (leer = Eisblau)
migrate(
  (app) => {
    const seiten = app.findCollectionByNameOrId("seiten");
    if (!seiten.fields.getByName("daten")) {
      seiten.fields.add(new Field({ name: "daten", type: "json", maxSize: 200000 }));
      app.save(seiten);
    }
    const einstellungen = app.findCollectionByNameOrId("einstellungen");
    if (!einstellungen.fields.getByName("akzentfarbe")) {
      einstellungen.fields.add(new Field({ name: "akzentfarbe", type: "text", pattern: "^#[0-9a-fA-F]{6}$" }));
      app.save(einstellungen);
    }
  },
  (app) => {
    const seiten = app.findCollectionByNameOrId("seiten");
    seiten.fields.removeByName("daten");
    app.save(seiten);
    const einstellungen = app.findCollectionByNameOrId("einstellungen");
    einstellungen.fields.removeByName("akzentfarbe");
    app.save(einstellungen);
  }
);
