/// <reference path="../pb_data/types.d.ts" />
// Nützliche Links: die drei Bergbahn-Links (Startseite, Betriebszeiten, Webcams) zu einem
// zusammenfassen. Nur wenn die Liste noch aus Standardlinks besteht; Änderungen bleiben.
migrate(
  (app) => {
    const STANDARD = [
      // ursprüngliche Seed-Links
      "http://www.brigels.ch",
      "http://www.myswitzerland.com/de/search/search.cfm?phrase=brigels",
      "http://www.therme-vals.ch",
      "http://www.sbb.ch",
      // aus 1700000021
      "https://www.brigels-bergbahnen.ch/",
      "https://www.brigels-bergbahnen.ch/betriebszeiten",
      "https://www.brigels-bergbahnen.ch/webcams",
      "https://www.surselva.info/de/mia-surselva/ferienorte/breil/brigels",
      "https://7132.com/de/therme/therme/",
    ];
    const NEU = [
      ["Bergbahnen Brigels", "https://www.brigels-bergbahnen.ch/"],
      ["Brigels Tourismus", "https://www.surselva.info/de/mia-surselva/ferienorte/breil/brigels"],
      ["Therme Vals", "https://7132.com/de/therme/therme/"],
    ];

    const links = app.findRecordsByFilter("links", "", "", 0, 0);
    if (!links.every((link) => STANDARD.includes(link.getString("url")))) return;

    for (const link of links) app.delete(link);
    const collection = app.findCollectionByNameOrId("links");
    NEU.forEach(([titel, url], index) => {
      const record = new Record(collection);
      record.set("titel", titel);
      record.set("url", url);
      record.set("sort", index + 1);
      app.save(record);
    });
  },
  () => {}
);
