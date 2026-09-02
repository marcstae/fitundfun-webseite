/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const EDITOR =
      '@request.auth.rolle = "editor" && @request.auth.muss_passwort_aendern = false';
    const lager = app.findCollectionByNameOrId("lager");

    // Ein Lager-Modell für Entwürfe, veröffentlichte und vergangene Lager.
    if (!lager.fields.getByName("status")) {
      lager.fields.add(
        new Field({
          name: "status",
          type: "select",
          required: false,
          maxSelect: 1,
          values: ["entwurf", "veroeffentlicht", "archiviert"],
        })
      );
    }
    if (!lager.fields.getByName("quelle_url")) {
      lager.fields.add(new Field({ name: "quelle_url", type: "url" }));
    }
    lager.fields.getByName("datum_von").required = false;
    lager.fields.getByName("datum_bis").required = false;
    app.save(lager);

    for (const record of app.findAllRecords(lager)) {
      if (!record.getString("status")) {
        record.set("status", "veroeffentlicht");
        app.save(record);
      }
    }

    let archiv = null;
    try {
      archiv = app.findCollectionByNameOrId("archiv");
    } catch {}

    if (archiv) {
      for (const alt of app.findAllRecords(archiv)) {
        const jahr = alt.getInt("jahr");
        const existing = app.findRecordsByFilter(lager, `jahr = ${jahr}`, "", 1, 0);
        const ziel = existing[0] || new Record(lager);

        if (!existing[0]) {
          ziel.set("jahr", jahr);
          ziel.set("titel", `Lager ${jahr}`);
          ziel.set("status", "archiviert");
        }
        if (!ziel.getString("datum_von")) ziel.set("datum_von", alt.getString("datum_von"));
        if (!ziel.getString("datum_bis")) ziel.set("datum_bis", alt.getString("datum_bis"));
        if (!ziel.getString("beschreibung")) ziel.set("beschreibung", alt.getString("beschreibung"));
        if (!ziel.getString("youtube_url")) ziel.set("youtube_url", alt.getString("video_url"));
        if (!ziel.getInt("teilnehmer")) ziel.set("teilnehmer", alt.get("teilnehmer"));
        if (!ziel.get("preise")) ziel.set("preise", alt.get("preise"));
        if (!ziel.get("aktivitaeten")) ziel.set("aktivitaeten", alt.get("aktivitaeten"));
        if (!ziel.getString("quelle_url")) ziel.set("quelle_url", alt.getString("quelle_url"));
        app.save(ziel);

        for (const name of ["dokumente", "dokumente_intern", "fotoalben"]) {
          const collection = app.findCollectionByNameOrId(name);
          for (const record of app.findAllRecords(collection)) {
            if (record.getString("archiv") !== alt.id) continue;
            if (name === "fotoalben") {
              const duplicate = app.findRecordsByFilter(
                collection,
                `lager = "${ziel.id}" && id != "${record.id}"`,
                "",
                1,
                0
              );
              if (duplicate.length) {
                throw new Error(`Zwei Fotoalben für Lager ${jahr}; Migration abgebrochen.`);
              }
            }
            record.set("lager", ziel.id);
            record.set("archiv", "");
            app.save(record);
          }
        }
        app.delete(alt);
      }

      for (const name of ["dokumente", "dokumente_intern", "fotoalben"]) {
        const collection = app.findCollectionByNameOrId(name);
        for (const record of app.findAllRecords(collection)) {
          if (!record.getString("lager")) {
            throw new Error(`${name}/${record.id} ist keinem Lager zugeordnet.`);
          }
        }
        collection.fields.getByName("lager").required = true;
        const archivField = collection.fields.getByName("archiv");
        if (archivField) collection.fields.removeByName("archiv");
        collection.indexes = collection.indexes.filter(
          (index) => !index.includes("fotoalben_archiv")
        );
        app.save(collection);
      }
      app.delete(archiv);
    }

    lager.fields.getByName("status").required = true;
    lager.listRule = 'status != "entwurf" || @request.auth.rolle = "editor"';
    lager.viewRule = 'status != "entwurf" || @request.auth.rolle = "editor"';
    lager.createRule = EDITOR;
    lager.updateRule = EDITOR;
    lager.deleteRule = EDITOR;
    app.save(lager);

    const dokumente = app.findCollectionByNameOrId("dokumente");
    dokumente.listRule = 'lager.status != "entwurf" || @request.auth.rolle = "editor"';
    dokumente.viewRule = 'lager.status != "entwurf" || @request.auth.rolle = "editor"';
    app.save(dokumente);

    const intern = app.findCollectionByNameOrId("dokumente_intern");
    intern.listRule =
      '(@request.auth.id != "" && lager.status != "entwurf") || @request.auth.rolle = "editor"';
    intern.viewRule = intern.listRule;
    app.save(intern);

    const fotoalben = app.findCollectionByNameOrId("fotoalben");
    fotoalben.listRule =
      '(@request.auth.id != "" && lager.status != "entwurf") || @request.auth.rolle = "editor"';
    fotoalben.viewRule = fotoalben.listRule;
    fotoalben.createRule = EDITOR;
    fotoalben.updateRule = EDITOR;
    fotoalben.deleteRule = EDITOR;
    app.save(fotoalben);
  },
  (app) => {
    const EDITOR = '@request.auth.rolle = "editor"';
    const lager = app.findCollectionByNameOrId("lager");
    const drafts = app.findRecordsByFilter(lager, 'status = "entwurf"', "", 1, 0);
    if (drafts.length) {
      throw new Error("Rollback mit vorhandenen Entwürfen ist nicht verlustfrei möglich.");
    }

    const archiv = new Collection({
      name: "archiv",
      type: "base",
      listRule: "",
      viewRule: "",
      createRule: EDITOR,
      updateRule: EDITOR,
      deleteRule: EDITOR,
      indexes: ['CREATE UNIQUE INDEX idx_archiv_jahr ON `archiv` (`jahr`)'],
      fields: [
        { name: "jahr", type: "number", required: true },
        { name: "video_url", type: "url" },
        { name: "beschreibung", type: "text" },
        { name: "datum_von", type: "date" },
        { name: "datum_bis", type: "date" },
        { name: "teilnehmer", type: "number" },
        { name: "preise", type: "json" },
        { name: "aktivitaeten", type: "json" },
        { name: "quelle_url", type: "url" },
      ],
    });
    app.save(archiv);

    for (const name of ["dokumente", "dokumente_intern", "fotoalben"]) {
      const collection = app.findCollectionByNameOrId(name);
      collection.fields.getByName("lager").required = false;
      collection.fields.add(
        new Field({
          name: "archiv",
          type: "relation",
          collectionId: archiv.id,
          maxSelect: 1,
          required: false,
          cascadeDelete: true,
        })
      );
      if (name === "fotoalben") {
        collection.indexes.push(
          "CREATE UNIQUE INDEX idx_fotoalben_archiv ON fotoalben (archiv) WHERE archiv != ''"
        );
      }
      app.save(collection);
    }

    for (const record of app.findAllRecords(lager)) {
      if (record.getString("status") !== "archiviert") continue;
      const alt = new Record(archiv);
      alt.set("jahr", record.getInt("jahr"));
      alt.set("video_url", record.getString("youtube_url"));
      alt.set("beschreibung", record.getString("beschreibung"));
      alt.set("datum_von", record.getString("datum_von"));
      alt.set("datum_bis", record.getString("datum_bis"));
      alt.set("teilnehmer", record.get("teilnehmer"));
      alt.set("preise", record.get("preise"));
      alt.set("aktivitaeten", record.get("aktivitaeten"));
      alt.set("quelle_url", record.getString("quelle_url"));
      app.save(alt);

      for (const name of ["dokumente", "dokumente_intern", "fotoalben"]) {
        const collection = app.findCollectionByNameOrId(name);
        for (const related of app.findAllRecords(collection)) {
          if (related.getString("lager") !== record.id) continue;
          related.set("archiv", alt.id);
          related.set("lager", "");
          app.save(related);
        }
      }
      app.delete(record);
    }

    const status = lager.fields.getByName("status");
    if (status) lager.fields.removeByName("status");
    const quelle = lager.fields.getByName("quelle_url");
    if (quelle) lager.fields.removeByName("quelle_url");
    lager.fields.getByName("datum_von").required = true;
    lager.fields.getByName("datum_bis").required = true;
    lager.listRule = "";
    lager.viewRule = "";
    app.save(lager);

    const dokumente = app.findCollectionByNameOrId("dokumente");
    dokumente.listRule = "";
    dokumente.viewRule = "";
    app.save(dokumente);

    const intern = app.findCollectionByNameOrId("dokumente_intern");
    intern.listRule = '@request.auth.id != ""';
    intern.viewRule = '@request.auth.id != ""';
    app.save(intern);

    const fotoalben = app.findCollectionByNameOrId("fotoalben");
    fotoalben.listRule = '@request.auth.id != ""';
    fotoalben.viewRule = '@request.auth.id != ""';
    fotoalben.createRule = EDITOR;
    fotoalben.updateRule = EDITOR;
    fotoalben.deleteRule = EDITOR;
    app.save(fotoalben);
  }
);
