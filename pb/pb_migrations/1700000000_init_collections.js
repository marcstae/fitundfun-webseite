/// <reference path="../pb_data/types.d.ts" />
//
// Auto-Migration: erstellt alle Collections für fit&fun beim ersten Start.
// PB 0.21+ API. Sicher idempotent dank "if not exists"-Prüfungen.
// =====================================================================

function exists(app, name) {
  try {
    return !!app.findCollectionByNameOrId(name);
  } catch {
    return false;
  }
}

function ensureCollection(app, def) {
  if (exists(app, def.name)) {
    return app.findCollectionByNameOrId(def.name);
  }
  // CollectionBase-Definition wie im PB-Admin-Editor
  const collection = new Collection({
    name: def.name,
    type: "base",
    listRule: def.listRule ?? "",
    viewRule: def.viewRule ?? "",
    createRule: def.createRule ?? "",
    updateRule: def.updateRule ?? "",
    deleteRule: def.deleteRule ?? "",
    fields: def.fields,
    indexes: def.indexes || [],
  });
  app.dao().saveCollection(collection);
  return collection;
}

const EDITOR = '@request.auth.rolle = "editor"';

migrate((app) => {
  // ---- lager ----
  ensureCollection(app, {
    name: "lager",
    listRule: "",
    viewRule: "",
    createRule: EDITOR,
    updateRule: EDITOR,
    deleteRule: EDITOR,
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

  // ---- dokumente (öffentliche PDFs) ----
  ensureCollection(app, {
    name: "dokumente",
    listRule: "",
    viewRule: "",
    createRule: EDITOR,
    updateRule: EDITOR,
    deleteRule: EDITOR,
    fields: [
      { name: "name", type: "text", required: true },
      {
        name: "datei",
        type: "file",
        required: true,
        options: { mimeTypes: ["application/pdf"], maxSelect: 1, maxFilesize: 26214400 },
      },
      { name: "lager", type: "relation", required: true, options: { collectionId: "lager", maxSelect: 1, cascadeDelete: true } },
      { name: "sensibel", type: "bool" },
      { name: "sort", type: "number" },
    ],
  });

  // ---- dokumente_intern (sensible PDFs, protected file) ----
  ensureCollection(app, {
    name: "dokumente_intern",
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: EDITOR,
    updateRule: EDITOR,
    deleteRule: EDITOR,
    fields: [
      { name: "name", type: "text", required: true },
      {
        name: "datei",
        type: "file",
        required: true,
        options: { mimeTypes: ["application/pdf"], maxSelect: 1, maxFilesize: 26214400 },
      },
      { name: "lager", type: "relation", required: true, options: { collectionId: "lager", maxSelect: 1, cascadeDelete: true } },
      { name: "sensibel", type: "bool" },
      { name: "sort", type: "number" },
    ],
  });

  // Protected-Flag für datei-Feld in dokumente_intern setzen
  const intern = app.findCollectionByNameOrId("dokumente_intern");
  const dateiField = intern.fields.find((f) => f.name === "datei");
  if (dateiField) {
    dateiField.options.protected = true;
    app.dao().saveCollection(intern);
  }

  // ---- seiten ----
  ensureCollection(app, {
    name: "seiten",
    listRule: "",
    viewRule: "",
    createRule: EDITOR,
    updateRule: EDITOR,
    deleteRule: EDITOR,
    indexes: ['CREATE UNIQUE INDEX idx_seiten_slug ON `seiten` (`slug`)'],
    fields: [
      { name: "slug", type: "text", required: true },
      { name: "titel", type: "text" },
      { name: "inhalt", type: "editor" },
      { name: "bilder", type: "file", options: { maxSelect: 20 } },
    ],
  });

  // ---- archiv ----
  ensureCollection(app, {
    name: "archiv",
    listRule: "",
    viewRule: "",
    createRule: EDITOR,
    updateRule: EDITOR,
    deleteRule: EDITOR,
    indexes: ['CREATE UNIQUE INDEX idx_archiv_jahr ON `archiv` (`jahr`)'],
    fields: [
      { name: "jahr", type: "number", required: true },
      { name: "video_url", type: "url" },
      { name: "fotos_url", type: "url" },
    ],
  });

  // ---- sponsoren ----
  ensureCollection(app, {
    name: "sponsoren",
    listRule: "",
    viewRule: "",
    createRule: EDITOR,
    updateRule: EDITOR,
    deleteRule: EDITOR,
    fields: [
      { name: "name", type: "text", required: true },
      { name: "logo", type: "file", options: { maxSelect: 1 } },
      { name: "url", type: "url" },
      { name: "sort", type: "number" },
    ],
  });

  // ---- links ----
  ensureCollection(app, {
    name: "links",
    listRule: "",
    viewRule: "",
    createRule: EDITOR,
    updateRule: EDITOR,
    deleteRule: EDITOR,
    fields: [
      { name: "titel", type: "text", required: true },
      { name: "url", type: "url", required: true },
      { name: "sort", type: "number" },
    ],
  });

  // ---- kontakte ----
  ensureCollection(app, {
    name: "kontakte",
    listRule: "",
    viewRule: "",
    createRule: EDITOR,
    updateRule: EDITOR,
    deleteRule: EDITOR,
    fields: [
      { name: "rolle", type: "select", required: true, options: { maxSelect: 1, values: ["Lagerleiter", "Website"] } },
      { name: "name", type: "text", required: true },
      { name: "sort", type: "number" },
    ],
  });

  // ---- einstellungen (genau 1 Record) ----
  ensureCollection(app, {
    name: "einstellungen",
    listRule: "",
    viewRule: "",
    createRule: EDITOR,
    updateRule: EDITOR,
    deleteRule: "",
    fields: [
      { name: "hero_video", type: "file", options: { maxSelect: 1, mimeTypes: ["video/mp4", "video/webm"], maxFilesize: 62914560 } },
      { name: "hero_poster", type: "file", options: { maxSelect: 1 } },
      { name: "hero_titel", type: "text" },
      { name: "hero_willkommen", type: "text" },
    ],
  });

  // ---- users (Auth-Collection mit Rolle) ----
  if (!exists(app, "users")) {
    const users = new Collection({
      name: "users",
      type: "auth",
      listRule: "id = @request.auth.id",
      viewRule: "id = @request.auth.id",
      createRule: "",
      updateRule: "id = @request.auth.id",
      deleteRule: "id = @request.auth.id",
      fields: [
        {
          name: "rolle",
          type: "select",
          required: true,
          options: { maxSelect: 1, values: ["editor", "familie"] },
        },
      ],
    });
    app.dao().saveCollection(users);
    users.options = Object.assign({}, users.options || {}, {
      allowUserRegistrations: false,
      allowOAuth2Registrations: false,
    });
    app.dao().saveCollection(users);
    console.log("[fitundfun] users-Collection erstellt, Registrierung deaktiviert.");
  } else {
    const users = app.findCollectionByNameOrId("users");
    if (!users.fields.find((f) => f.name === "rolle")) {
      users.fields.push({
        name: "rolle",
        type: "select",
        required: true,
        options: { maxSelect: 1, values: ["editor", "familie"] },
      });
      app.dao().saveCollection(users);
    }
  }

  console.log("[fitundfun] Migration abgeschlossen — Collections erstellt.");
}, (app) => {
  // Rollback (nur manuell) — Collections nicht automatisch löschen, um Datenverlust zu vermeiden.
});
