/// <reference path="../pb_data/types.d.ts" />
// Die Sponsoren-Seite und ihr Editor sind seit 22b456a weg, die Sammlung war aber noch öffentlich
// lesbar. Die Einträge samt Logos liegen als Export im Backup-Ordner auf dem Server (2026-11-17).
// Rückweg: leere Sammlung mit dem Schema aus Migration 0 und den Regeln aus Migration 11.
migrate(
  (app) => {
    let sponsoren;
    try {
      sponsoren = app.findCollectionByNameOrId("sponsoren");
    } catch {
      return; // schon weg
    }
    app.delete(sponsoren);
  },
  (app) => {
    const EDITOR = '@request.auth.rolle = "editor" && @request.auth.muss_passwort_aendern = false';
    app.save(
      new Collection({
        name: "sponsoren",
        type: "base",
        listRule: "",
        viewRule: "",
        createRule: EDITOR,
        updateRule: EDITOR,
        deleteRule: EDITOR,
        fields: [
          { name: "name", type: "text", required: true },
          { name: "logo", type: "file", maxSelect: 1 },
          { name: "url", type: "url" },
          { name: "sort", type: "number" },
        ],
      })
    );
  }
);
