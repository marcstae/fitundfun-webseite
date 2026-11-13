/// <reference path="../pb_data/types.d.ts" />
// Sammlung familienzugang heisst wie im Cockpit: lagerpasswort. Regeln und Daten bleiben gleich.
migrate(
  (app) => {
    let sammlung;
    try {
      sammlung = app.findCollectionByNameOrId("familienzugang");
    } catch {
      return; // schon umbenannt
    }
    sammlung.name = "lagerpasswort";
    app.save(sammlung);
  },
  (app) => {
    const sammlung = app.findCollectionByNameOrId("lagerpasswort");
    sammlung.name = "familienzugang";
    app.save(sammlung);
  }
);
