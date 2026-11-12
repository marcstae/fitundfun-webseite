/// <reference path="../pb_data/types.d.ts" />
// Zweite Akzentfarbe für dunklen Grund (heute Signalorange). Nur ein neues Feld; leer = Standard.
migrate(
  (app) => {
    const einstellungen = app.findCollectionByNameOrId("einstellungen");
    if (!einstellungen.fields.getByName("akzentfarbe_dunkel")) {
      einstellungen.fields.add(new Field({ name: "akzentfarbe_dunkel", type: "text", pattern: "^#[0-9a-fA-F]{6}$" }));
      app.save(einstellungen);
    }
  },
  (app) => {
    const einstellungen = app.findCollectionByNameOrId("einstellungen");
    einstellungen.fields.removeByName("akzentfarbe_dunkel");
    app.save(einstellungen);
  }
);
