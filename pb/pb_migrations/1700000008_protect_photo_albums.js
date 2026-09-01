/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const editor = '@request.auth.rolle = "editor"';
    const lager = app.findCollectionByNameOrId("lager");
    const archiv = app.findCollectionByNameOrId("archiv");

    let fotoalben;
    try {
      fotoalben = app.findCollectionByNameOrId("fotoalben");
    } catch {
      fotoalben = new Collection({
        name: "fotoalben",
        type: "base",
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: editor,
        updateRule: editor,
        deleteRule: editor,
        fields: [
          { name: "lager", type: "relation", collectionId: lager.id, maxSelect: 1, cascadeDelete: true },
          { name: "archiv", type: "relation", collectionId: archiv.id, maxSelect: 1, cascadeDelete: true },
          { name: "url", type: "url", required: true },
        ],
        indexes: [
          "CREATE UNIQUE INDEX idx_fotoalben_lager ON fotoalben (lager) WHERE lager != ''",
          "CREATE UNIQUE INDEX idx_fotoalben_archiv ON fotoalben (archiv) WHERE archiv != ''",
        ],
      });
      app.save(fotoalben);
      fotoalben = app.findCollectionByNameOrId("fotoalben");
    }

    for (const record of app.findAllRecords(lager)) {
      const url = record.getString("immich_url");
      if (!url) continue;
      const album = new Record(fotoalben);
      album.set("lager", record.id);
      album.set("url", url);
      app.save(album);
    }
    for (const record of app.findAllRecords(archiv)) {
      const url = record.getString("fotos_url");
      if (!url) continue;
      const album = new Record(fotoalben);
      album.set("archiv", record.id);
      album.set("url", url);
      app.save(album);
    }

    if (lager.fields.getByName("immich_url")) {
      lager.fields.removeByName("immich_url");
      app.save(lager);
    }
    if (archiv.fields.getByName("fotos_url")) {
      archiv.fields.removeByName("fotos_url");
      app.save(archiv);
    }
  },
  (app) => {
    const lager = app.findCollectionByNameOrId("lager");
    const archiv = app.findCollectionByNameOrId("archiv");
    if (!lager.fields.getByName("immich_url")) {
      lager.fields.add(new Field({ name: "immich_url", type: "url" }));
      app.save(lager);
    }
    if (!archiv.fields.getByName("fotos_url")) {
      archiv.fields.add(new Field({ name: "fotos_url", type: "url" }));
      app.save(archiv);
    }

    let fotoalben;
    try {
      fotoalben = app.findCollectionByNameOrId("fotoalben");
    } catch {
      return;
    }
    for (const album of app.findAllRecords(fotoalben)) {
      const lagerId = album.getString("lager");
      const archivId = album.getString("archiv");
      if (lagerId) {
        const record = app.findRecordById(lager, lagerId);
        record.set("immich_url", album.getString("url"));
        app.save(record);
      }
      if (archivId) {
        const record = app.findRecordById(archiv, archivId);
        record.set("fotos_url", album.getString("url"));
        app.save(record);
      }
    }
    app.delete(fotoalben);
  }
);
