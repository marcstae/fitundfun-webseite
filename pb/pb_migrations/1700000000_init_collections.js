migrate((app) => {
  const EDITOR = '@request.auth.rolle = "editor"';

  function exists(app, name) {
    try { return !!app.findCollectionByNameOrId(name); } catch { return false; }
  }

  function ensureCollection(app, def) {
    if (exists(app, def.name)) {
      return app.findCollectionByNameOrId(def.name);
    }
    const collection = new Collection({
      name: def.name,
      type: def.type || "base",
      listRule: def.listRule ?? "",
      viewRule: def.viewRule ?? "",
      createRule: def.createRule ?? "",
      updateRule: def.updateRule ?? "",
      deleteRule: def.deleteRule ?? "",
      fields: def.fields,
      indexes: def.indexes || [],
    });
    app.save(collection);
    return app.findCollectionByNameOrId(def.name);
  }

  console.log("[1/9] lager");
  ensureCollection(app, { name: "lager", createRule: EDITOR, updateRule: EDITOR, deleteRule: EDITOR,
    indexes: ['CREATE UNIQUE INDEX idx_lager_jahr ON `lager` (`jahr`)'],
    fields: [
      { name: "jahr", type: "number", required: true },
      { name: "titel", type: "text" },
      { name: "datum_von", type: "date", required: true },
      { name: "datum_bis", type: "date", required: true },
      { name: "beschreibung", type: "editor" },
      { name: "youtube_url", type: "url" },
      { name: "immich_url", type: "url" },
    ],
  });

  const lagerId = app.findCollectionByNameOrId("lager").id;

  console.log("[2/9] dokumente");
  ensureCollection(app, { name: "dokumente", createRule: EDITOR, updateRule: EDITOR, deleteRule: EDITOR,
    fields: [
      { name: "name", type: "text", required: true },
      { name: "datei", type: "file", required: true, mimeTypes: ["application/pdf"], maxSelect: 1, maxFilesize: 26214400 },
      { name: "lager", type: "relation", required: true, collectionId: lagerId, maxSelect: 1, cascadeDelete: true },
      { name: "sensibel", type: "bool" },
      { name: "sort", type: "number" },
    ],
  });

  console.log("[3/9] dokumente_intern");
  ensureCollection(app, { name: "dokumente_intern", listRule: '@request.auth.id != ""', viewRule: '@request.auth.id != ""', createRule: EDITOR, updateRule: EDITOR, deleteRule: EDITOR,
    fields: [
      { name: "name", type: "text", required: true },
      { name: "datei", type: "file", required: true, mimeTypes: ["application/pdf"], maxSelect: 1, maxFilesize: 26214400 },
      { name: "lager", type: "relation", required: true, collectionId: lagerId, maxSelect: 1, cascadeDelete: true },
      { name: "sensibel", type: "bool" },
      { name: "sort", type: "number" },
    ],
  });

  console.log("[4/9] seiten");
  ensureCollection(app, { name: "seiten", createRule: EDITOR, updateRule: EDITOR, deleteRule: EDITOR,
    indexes: ['CREATE UNIQUE INDEX idx_seiten_slug ON `seiten` (`slug`)'],
    fields: [
      { name: "slug", type: "text", required: true },
      { name: "titel", type: "text" },
      { name: "inhalt", type: "editor" },
      { name: "bilder", type: "file", maxSelect: 20 },
    ],
  });

  console.log("[5/9] archiv");
  ensureCollection(app, { name: "archiv", createRule: EDITOR, updateRule: EDITOR, deleteRule: EDITOR,
    indexes: ['CREATE UNIQUE INDEX idx_archiv_jahr ON `archiv` (`jahr`)'],
    fields: [
      { name: "jahr", type: "number", required: true },
      { name: "video_url", type: "url" },
      { name: "fotos_url", type: "url" },
    ],
  });

  console.log("[6/9] sponsoren");
  ensureCollection(app, { name: "sponsoren", createRule: EDITOR, updateRule: EDITOR, deleteRule: EDITOR,
    fields: [
      { name: "name", type: "text", required: true },
      { name: "logo", type: "file", maxSelect: 1 },
      { name: "url", type: "url" },
      { name: "sort", type: "number" },
    ],
  });

  console.log("[7/9] links");
  ensureCollection(app, { name: "links", createRule: EDITOR, updateRule: EDITOR, deleteRule: EDITOR,
    fields: [
      { name: "titel", type: "text", required: true },
      { name: "url", type: "url", required: true },
      { name: "sort", type: "number" },
    ],
  });

  console.log("[8/9] kontakte");
  ensureCollection(app, { name: "kontakte", createRule: EDITOR, updateRule: EDITOR, deleteRule: EDITOR,
    fields: [
      { name: "rolle", type: "select", required: true, maxSelect: 1, values: ["Lagerleiter", "Website"] },
      { name: "name", type: "text", required: true },
      { name: "sort", type: "number" },
    ],
  });

  console.log("[9/9] einstellungen");
  ensureCollection(app, { name: "einstellungen", createRule: EDITOR, updateRule: EDITOR, deleteRule: "",
    fields: [
      { name: "hero_video", type: "file", maxSelect: 1, mimeTypes: ["video/mp4", "video/webm"], maxFilesize: 62914560 },
      { name: "hero_poster", type: "file", maxSelect: 1 },
      { name: "hero_titel", type: "text" },
      { name: "hero_willkommen", type: "text" },
    ],
  });

  console.log("[fitundfun] users collection");
  if (!exists(app, "users")) {
    const users = new Collection({
      name: "users",
      type: "auth",
      listRule: "id = @request.auth.id",
      viewRule: "id = @request.auth.id",
      createRule: "",
      updateRule: "id = @request.auth.id",
      deleteRule: "id = @request.auth.id",
      passwordAuth: { enabled: true },
      allowUserRegistrations: false,
      allowOAuth2Registrations: false,
      fields: [
        { name: "rolle", type: "select", required: true, maxSelect: 1, values: ["editor", "familie"] },
      ],
    });
    app.save(users);
    console.log("[fitundfun] users-Collection erstellt.");
  }

  console.log("[fitundfun] Migration abgeschlossen — Collections erstellt.");
}, (app) => {});
