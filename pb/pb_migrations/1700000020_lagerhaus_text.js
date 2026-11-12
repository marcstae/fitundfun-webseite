/// <reference path="../pb_data/types.d.ts" />
// Lagerhaus-Seite: neuer Einleitungstext nach den Angaben des Ferienheims. Ersetzt nur den
// ursprünglichen Standardtext; hat die Lagerleitung im Cockpit eigenen Text gespeichert, bleibt er.
migrate(
  (app) => {
    const ALT = "<p>Das Ferienheim Albin – Casa Crestneder ist seit vielen Jahren unser Zuhause während der Lagerwoche.</p><p>Hier schlafen, kochen, essen und verbringen wir die Abende gemeinsam. Das Haus liegt in Brigels und bietet kurze Wege ins Dorf und ins Wintersportgebiet.</p><ul><li>Ferienheim Albin, Casa Crestneder, 7165 Brigels</li><li>Gemeinschaftsräume für Essen, Spiele und Abendprogramm</li><li>Bettzeug ist vollständig vorhanden</li></ul>";
    const NEU = "<p>Das Ferienheim Albin liegt im alten Dorfkern von Brigels, ruhig auf einer Sonnenterrasse mit Blick auf die Bündner Berge. Hier schlafen, kochen, essen und verbringen wir die Abende gemeinsam. Skifahren, Schlitteln und Winterwandern beginnen direkt vor der Haustür: Die Talstation der Bergbahnen ist in 5 Minuten erreichbar.</p>";
    try {
      const seite = app.findFirstRecordByFilter("seiten", 'slug = "lagerhaus"');
      if (seite.getString("inhalt") === ALT) {
        seite.set("inhalt", NEU);
        app.save(seite);
      }
    } catch {
      // Keine Lagerhaus-Seite in der DB: Die Website zeigt dann ihren Standardtext.
    }
  },
  () => {}
);
