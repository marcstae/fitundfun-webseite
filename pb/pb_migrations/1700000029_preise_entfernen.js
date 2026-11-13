/// <reference path="../pb_data/types.d.ts" />
// Lagerpreise gehören ins Anmeldeformular (PDF), nicht auf die Website: Feld lager.preise entfernen.
// Die Website zeigte es nicht mehr, über die öffentliche API waren die Werte aber noch lesbar.
migrate(
  (app) => {
    const lager = app.findCollectionByNameOrId("lager");
    if (lager.fields.getByName("preise")) {
      lager.fields.removeByName("preise");
      app.save(lager);
    }
  },
  (app) => {
    // Zurück nur das leere Feld; die Werte sind weg (Backup vor dem Deploy).
    const lager = app.findCollectionByNameOrId("lager");
    if (!lager.fields.getByName("preise")) {
      lager.fields.add(new Field({ name: "preise", type: "json" }));
      app.save(lager);
    }
  }
);
