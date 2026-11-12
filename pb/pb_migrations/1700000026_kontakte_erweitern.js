/// <reference path="../pb_data/types.d.ts" />
// Kontakte: Gruppen Skilehrer, Snowboardlehrer, Küche; optionale Telefonnummer; je E-Mail und
// Telefon «nur mit Lagerpasswort». Bestehende Kontakte bleiben, wie sie sind (öffentlich).
// Weil Angaben geschützt sein können, ist die Sammlung nicht mehr öffentlich lesbar: Die Website
// liest sie über das Familienkonto des Servers und gibt Geschütztes nur mit Lagerpasswort aus.
migrate(
  (app) => {
    const EDITOR = '@request.auth.rolle = "editor" && @request.auth.muss_passwort_aendern = false';
    const kontakte = app.findCollectionByNameOrId("kontakte");
    kontakte.fields.getByName("rolle").values = ["Lagerleiter", "Skilehrer", "Snowboardlehrer", "Kueche", "Website"];
    if (!kontakte.fields.getByName("telefon")) {
      kontakte.fields.add(new Field({ name: "telefon", type: "text", max: 40 }));
    }
    for (const name of ["email_geschuetzt", "telefon_geschuetzt"]) {
      if (!kontakte.fields.getByName(name)) kontakte.fields.add(new Field({ name, type: "bool" }));
    }
    kontakte.listRule = `@request.auth.rolle = "familie" || (${EDITOR})`;
    kontakte.viewRule = kontakte.listRule;
    app.save(kontakte);
  },
  (app) => {
    const kontakte = app.findCollectionByNameOrId("kontakte");
    kontakte.listRule = "";
    kontakte.viewRule = "";
    for (const name of ["telefon", "email_geschuetzt", "telefon_geschuetzt"]) kontakte.fields.removeByName(name);
    kontakte.fields.getByName("rolle").values = ["Lagerleiter", "Website"];
    app.save(kontakte);
  }
);
