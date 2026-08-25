/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    if (!users.fields.getByName("rolle")) {
      users.fields.add(
        new Field({
          name: "rolle",
          type: "select",
          maxSelect: 1,
          values: ["editor", "familie"],
        })
      );
    }

    users.listRule = "id = @request.auth.id";
    users.viewRule = "id = @request.auth.id";
    users.createRule = null;
    users.updateRule = "id = @request.auth.id && @request.body.rolle:changed = false";
    users.deleteRule = null;
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    if (users.fields.getByName("rolle")) {
      users.fields.removeByName("rolle");
    }
    app.save(users);
  }
);
