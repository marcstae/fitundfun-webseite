/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    for (const name of ["dokumente", "dokumente_intern"]) {
      const collection = app.findCollectionByNameOrId(name);
      const fileField = collection.fields.getByName("datei");
      if (fileField) {
        fileField.mimeTypes = allowed;
        app.save(collection);
      }
    }
  },
  (app) => {
    const allowed = ["application/pdf"];
    for (const name of ["dokumente", "dokumente_intern"]) {
      const collection = app.findCollectionByNameOrId(name);
      const fileField = collection.fields.getByName("datei");
      if (fileField) {
        fileField.mimeTypes = allowed;
        app.save(collection);
      }
    }
  }
);
