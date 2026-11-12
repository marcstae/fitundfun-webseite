/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const email = $os.getenv("FAMILY_ACCESS_EMAIL") || "familie@fitundfun.local";
    // Vorläufiges Zufallspasswort; 1700000016_haertung.js setzt das Konto auf FAMILY_ACCESS_SECRET.
    const accountPassword = $security.randomString(48);
    const users = app.findCollectionByNameOrId("users");

    let record;
    try {
      record = app.findAuthRecordByEmail(users, email);
    } catch {
      record = new Record(users);
      record.set("email", email);
    }

    record.set("rolle", "familie");
    record.set("verified", true);
    record.setPassword(accountPassword);
    app.save(record);
  },
  () => {
    // Deliberately keep a possibly pre-existing shared family account on rollback.
  }
);
