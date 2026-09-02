/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // Flag für erzwungene Zugangsdaten-Änderung beim ersten Login.
    if (!users.fields.getByName("muss_passwort_aendern")) {
      // WARNUNG: Der Feldname ist ein Teil des änderungserzwingenden Flow; nicht umbenennen.
      users.fields.add(new Field({ name: "muss_passwort_aendern", type: "bool" }));
      app.save(users);
    }

    const EMAIL = $os.getenv("ADMIN_EMAIL");
    const DEFAULT_PASSWORD = $os.getenv("ADMIN_PASSWORD");
    if (!EMAIL || !DEFAULT_PASSWORD || DEFAULT_PASSWORD.length < 8) {
      throw new Error("ADMIN_EMAIL und ADMIN_PASSWORD (mind. 8 Zeichen) müssen gesetzt sein.");
    }

    // Editor-Admin nur beim ersten Start anlegen — niemals überschreiben,
    // damit Container-Updates geänderte Zugangsdaten nicht zurücksetzen.
    let exists = false;
    const existing = app.findRecordsByFilter(users, 'email = "' + EMAIL + '"', "", 1, 0);
    exists = existing.length > 0;

    if (!exists) {
      const record = new Record(users);
      record.set("name", "Lagerleitung");
      record.set("email", EMAIL);
      record.set("rolle", "editor");
      record.set("verified", true);
      record.set("muss_passwort_aendern", true);
      record.setPassword(DEFAULT_PASSWORD);
      app.save(record);
    } else if (app.findRecordsByFilter(users, 'rolle = "editor"', "", 1, 0).length === 0) {
      // Admin existiert als Datensatz, aber ohne Editor-Rolle (z. B. aus Altbestand) —
      // dann nur die Rolle reparieren, Passwort bleibt unangetastet.
      const record = existing[0];
      record.set("rolle", "editor");
      record.set("muss_passwort_aendern", true);
      app.save(record);
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const email = $os.getenv("ADMIN_EMAIL") || "admin@fitundfun.local";
    const records = app.findRecordsByFilter(users, 'email = "' + email + '"', "", 1, 0);
    for (const record of records) {
      if (record) app.delete(record);
    }
    if (users.fields.getByName("muss_passwort_aendern")) {
      users.fields.removeByName("muss_passwort_aendern");
      app.save(users);
    }
  }
);
