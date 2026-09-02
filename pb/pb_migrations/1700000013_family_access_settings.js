/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const EDITOR =
      '@request.auth.rolle = "editor" && @request.auth.muss_passwort_aendern = false';
    const collection = new Collection({
      name: "familienzugang",
      type: "base",
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: EDITOR,
      updateRule: EDITOR,
      deleteRule: EDITOR,
      fields: [
        { name: "password_hash", type: "text" },
        { name: "cookie_version", type: "number", required: true },
      ],
    });
    app.save(collection);

    const record = new Record(collection);
    // Leerer Hash = bestehendes FAMILY_ACCESS_PASSWORD gilt bis zur ersten
    // Änderung im Cockpit. Das Passwort selbst wird nie in PocketBase gespeichert.
    record.set("password_hash", "");
    record.set("cookie_version", 1);
    app.save(record);
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("familienzugang"));
    } catch {}
  }
);
