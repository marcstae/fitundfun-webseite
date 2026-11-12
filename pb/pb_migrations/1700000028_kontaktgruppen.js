/// <reference path="../pb_data/types.d.ts" />
// Eigene Kontaktgruppen statt der festen Auswahl (kontakte.rolle):
// - neue Sammlung kontaktgruppen (Name, Reihenfolge), lesbar wie die Kontakte
// - die bisherigen fünf Gruppen werden übernommen, mit eigenen Überschriften der Kontaktseite
// - jeder Kontakt bekommt seine Gruppe (kontakte.gruppe); rolle bleibt als Altwert stehen
migrate(
  (app) => {
    const EDITOR = '@request.auth.rolle = "editor" && @request.auth.muss_passwort_aendern = false';
    const LESEN = `@request.auth.rolle = "familie" || (${EDITOR})`;

    let gruppen;
    try {
      gruppen = app.findCollectionByNameOrId("kontaktgruppen");
    } catch {
      gruppen = new Collection({
        name: "kontaktgruppen",
        type: "base",
        listRule: LESEN,
        viewRule: LESEN,
        createRule: EDITOR,
        updateRule: EDITOR,
        deleteRule: EDITOR,
        fields: [
          { name: "name", type: "text", required: true, max: 60 },
          { name: "sort", type: "number" },
        ],
      });
      app.save(gruppen);
    }

    const ids = {};
    if (app.findAllRecords(gruppen).length === 0) {
      let ueberschriften = {};
      try {
        const seite = app.findFirstRecordByFilter("seiten", 'slug = "kontakt"');
        ueberschriften = JSON.parse(seite.getString("daten") || "{}").gruppen || {};
      } catch {}
      const bisher = [
        ["Lagerleiter", "Lagerleitung"],
        ["Skilehrer", "Skilehrer"],
        ["Snowboardlehrer", "Snowboardlehrer"],
        ["Kueche", "Küche"],
        ["Website", "Website"],
      ];
      bisher.forEach(([rolle, standard], index) => {
        const eigene = ueberschriften[rolle];
        const record = new Record(gruppen);
        record.set("name", (typeof eigene === "string" && eigene.trim()) || standard);
        record.set("sort", index + 1);
        app.save(record);
        ids[rolle] = record.id;
      });
    }

    const kontakte = app.findCollectionByNameOrId("kontakte");
    if (!kontakte.fields.getByName("gruppe")) {
      kontakte.fields.add(
        new Field({ name: "gruppe", type: "relation", collectionId: gruppen.id, maxSelect: 1, cascadeDelete: false })
      );
    }
    kontakte.fields.getByName("rolle").required = false;
    app.save(kontakte);

    for (const kontakt of app.findAllRecords(kontakte)) {
      const id = ids[kontakt.getString("rolle")];
      if (id && !kontakt.getString("gruppe")) {
        kontakt.set("gruppe", id);
        app.save(kontakt);
      }
    }
  },
  (app) => {
    const kontakte = app.findCollectionByNameOrId("kontakte");
    kontakte.fields.removeByName("gruppe");
    kontakte.fields.getByName("rolle").required = true;
    app.save(kontakte);
    try {
      app.delete(app.findCollectionByNameOrId("kontaktgruppen"));
    } catch {}
  }
);
