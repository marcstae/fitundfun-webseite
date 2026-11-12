/// <reference path="../pb_data/types.d.ts" />
// Nützliche Links auf den Lagerseiten: veraltete Standardlinks (brigels.ch leitet inzwischen auf die
// Bergbahnen um, alter myswitzerland-Link, SBB) durch aktuelle ersetzen. Nur wenn die Liste noch
// unverändert den ursprünglichen Standardlinks entspricht; Änderungen der Lagerleitung bleiben.
migrate(
  (app) => {
    const STANDARD = [
      "http://www.brigels.ch",
      "http://www.myswitzerland.com/de/search/search.cfm?phrase=brigels",
      "http://www.therme-vals.ch",
      "https://7132.com/de/therme/therme/",
      "http://www.sbb.ch",
    ];
    const NEU = [
      ["Bergbahnen Brigels", "https://www.brigels-bergbahnen.ch/"],
      ["Betriebszeiten der Anlagen", "https://www.brigels-bergbahnen.ch/betriebszeiten"],
      ["Webcams und Schneelage", "https://www.brigels-bergbahnen.ch/webcams"],
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
