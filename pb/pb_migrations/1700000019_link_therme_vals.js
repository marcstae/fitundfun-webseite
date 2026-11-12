/// <reference path="../pb_data/types.d.ts" />
// Therme Vals hat eine neue Adresse. Nur den alten Seed-Link ersetzen, eigene Anpassungen bleiben.
migrate(
  (app) => {
    for (const link of app.findRecordsByFilter("links", 'url ~ "therme-vals.ch"', "", 0, 0)) {
      link.set("url", "https://7132.com/de/therme/therme/");
      app.save(link);
    }
  },
  () => {}
);
