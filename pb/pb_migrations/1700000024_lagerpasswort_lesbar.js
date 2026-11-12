/// <reference path="../pb_data/types.d.ts" />
// Lagerpasswort lesbar speichern, damit eingeloggte Admins es im Konto sehen. Lesen dürfen
// nur Editoren und das interne Familienkonto des Servers (Regeln aus Migration 15).
// Geprüft wird weiterhin über password_hash.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("familienzugang");
    if (!collection.fields.getByName("passwort")) {
      collection.fields.add(new Field({ name: "passwort", type: "text" }));
      app.save(collection);
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("familienzugang");
    collection.fields.removeByName("passwort");
    app.save(collection);
  }
);
