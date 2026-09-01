/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // PB 0.23 kennt den Operator `:changed` nicht — er liess jede
    // PATCH-Anfrage auf users mit 404 fehlschlagen. Ersatzregel:
    // Rolle darf nie abweichen, alle anderen Felder sind frei.
    const users = app.findCollectionByNameOrId("users");
    users.updateRule =
      'id = @request.auth.id && (@request.body.rolle = "" || @request.body.rolle = @request.auth.rolle)';
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.updateRule = "id = @request.auth.id && @request.body.rolle:changed = false";
    app.save(users);
  }
);