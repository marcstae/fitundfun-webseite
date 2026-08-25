/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const maxSize = 26214400;
    for (const name of ["dokumente", "dokumente_intern"]) {
      const collection = app.findCollectionByNameOrId(name);
      const fileField = collection.fields.getByName("datei");
      if (fileField) {
        fileField.maxSize = maxSize;
        app.save(collection);
      }
    }
  },
  (app) => {
    const maxSize = 5242880;
    for (const name of ["dokumente", "dokumente_intern"]) {
      const collection = app.findCollectionByNameOrId(name);
      const fileField = collection.fields.getByName("datei");
      if (fileField) {
        fileField.maxSize = maxSize;
        app.save(collection);
      }
    }
  }
);
