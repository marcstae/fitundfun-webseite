/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const lager = app.findCollectionByNameOrId("lager");
    const published = app
      .findAllRecords(lager)
      .filter((record) => record.getString("status") === "veroeffentlicht")
      .sort((left, right) => right.getInt("jahr") - left.getInt("jahr"));

    for (const record of published.slice(1)) {
      record.set("status", "archiviert");
      app.save(record);
    }
    if (!lager.indexes.some((index) => index.includes("idx_lager_one_published"))) {
      lager.indexes.push(
        "CREATE UNIQUE INDEX idx_lager_one_published ON lager (status) WHERE status = 'veroeffentlicht'"
      );
      app.save(lager);
    }
  },
  (app) => {
    const lager = app.findCollectionByNameOrId("lager");
    lager.indexes = lager.indexes.filter(
      (index) => !index.includes("idx_lager_one_published")
    );
    app.save(lager);
  }
);
