/// <reference path="../pb_data/types.d.ts" />
// Lager 2027 als Entwurf vorbereiten; die Lagerleitung prüft und veröffentlicht im Cockpit.
// Ein bereits angelegtes Lager 2027 bleibt unverändert.
migrate(
  (app) => {
    const lager = app.findCollectionByNameOrId("lager");
    if (app.findRecordsByFilter(lager, "jahr = 2027", "", 1, 0).length > 0) return;

    const record = new Record(lager);
    record.set("jahr", 2027);
    record.set("titel", "fit&fun Familienlager Brigels");
    record.set("datum_von", "2027-02-06 00:00:00.000Z");
    record.set("datum_bis", "2027-02-13 00:00:00.000Z");
    record.set(
      "beschreibung",
      "<p>6. – 13. Februar 2027 im Ferienheim Albin (Casa Crestneder), Brigels. Anmeldeformular und weitere Informationen folgen im November.</p>"
    );
    record.set("status", "entwurf");
    app.save(record);
  },
  () => {}
);
