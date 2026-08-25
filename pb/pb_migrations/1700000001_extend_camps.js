/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    function fieldByName(collection, name) {
      return collection.fields.getByName(name);
    }

    console.log("[extend] archiv: Historien-Felder");
    const archiv = app.findCollectionByNameOrId("archiv");
    const archivFields = [
      { name: "beschreibung", type: "text" },
      { name: "datum_von", type: "date" },
      { name: "datum_bis", type: "date" },
      { name: "teilnehmer", type: "number" },
      { name: "preise", type: "json" },
      { name: "aktivitaeten", type: "json" },
      { name: "quelle_url", type: "url" },
    ];
    for (const def of archivFields) {
      if (!fieldByName(archiv, def.name)) {
        archiv.fields.add(new Field(def));
      }
    }
    app.save(archiv);

    console.log("[extend] lager: Preise/Teilnehmende/Aktivitäten");
    const lager = app.findCollectionByNameOrId("lager");
    const lagerFields = [
      { name: "teilnehmer", type: "number" },
      { name: "preise", type: "json" },
      { name: "aktivitaeten", type: "json" },
    ];
    for (const def of lagerFields) {
      if (!fieldByName(lager, def.name)) {
        lager.fields.add(new Field(def));
      }
    }
    app.save(lager);

    console.log("[extend] dokumente: lager optional, archiv-Relation");
    for (const name of ["dokumente", "dokumente_intern"]) {
      const collection = app.findCollectionByNameOrId(name);
      const lagerField = fieldByName(collection, "lager");
      if (lagerField) {
        lagerField.required = false;
      }
      if (!fieldByName(collection, "archiv")) {
        collection.fields.add(
          new Field({
            name: "archiv",
            type: "relation",
            collectionId: app.findCollectionByNameOrId("archiv").id,
            maxSelect: 1,
            required: false,
            cascadeDelete: true,
          })
        );
      }
      app.save(collection);
    }
  },
  (app) => {
    for (const name of ["dokumente", "dokumente_intern"]) {
      const collection = app.findCollectionByNameOrId(name);
      const archivField = collection.fields.getByName("archiv");
      if (archivField) {
        collection.fields.removeByName("archiv");
        app.save(collection);
      }
    }
    for (const name of ["archiv", "lager"]) {
      const collection = app.findCollectionByNameOrId(name);
      for (const fieldName of ["beschreibung", "datum_von", "datum_bis", "teilnehmer", "preise", "aktivitaeten", "quelle_url"]) {
        const field = collection.fields.getByName(fieldName);
        if (field) {
          collection.fields.removeByName(fieldName);
        }
      }
      app.save(collection);
    }
  }
);
