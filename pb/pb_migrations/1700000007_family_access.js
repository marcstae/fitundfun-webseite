/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const email = $os.getenv("FAMILY_ACCESS_EMAIL") || "familie@fitundfun.local";
    const password = $os.getenv("FAMILY_ACCESS_PASSWORD");
    if (!password) {
      throw new Error("FAMILY_ACCESS_PASSWORD ist nicht gesetzt — Familienkonto kann nicht provisioniert werden.");
    }
    // Muss exakt family-access.ts (familyPocketBase) entsprechen.
    const accountPassword = `${password}-internal`;
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
