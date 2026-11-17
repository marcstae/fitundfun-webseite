/// <reference path="../pb_data/types.d.ts" />
// Mit manageRule durfte die Lagerleitung ihr eigenes Konto «verwalten». PocketBase prüft dann beim
// Passwortwechsel das alte Passwort nicht (oldPassword wurde zwar geschickt, aber ignoriert): Wer eine
// offene Cockpit-Sitzung hatte, konnte das Passwort ohne Kenntnis des alten ändern. Ohne manageRule
// gilt nur die updateRule (Migration 11), und PocketBase verlangt das richtige alte Passwort.
// E-Mail oder «verified» ändert das Cockpit nicht; dafür bleibt der Superuser.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.manageRule = null;
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.manageRule = '@request.auth.rolle = "editor" && id = @request.auth.id';
    app.save(users);
  }
);
