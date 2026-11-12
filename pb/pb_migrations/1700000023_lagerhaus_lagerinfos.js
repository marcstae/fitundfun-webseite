/// <reference path="../pb_data/types.d.ts" />
// Nur den bisherigen Standard kürzen; eigene Cockpit-Texte bleiben erhalten.
migrate(
  (app) => {
    const ALT = "<p>Das Ferienheim Albin liegt im alten Dorfkern von Brigels, ruhig auf einer Sonnenterrasse mit Blick auf die Bündner Berge. Hier schlafen, kochen, essen und verbringen wir die Abende gemeinsam. Skifahren, Schlitteln und Winterwandern beginnen direkt vor der Haustür: Die Talstation der Bergbahnen ist in 5 Minuten erreichbar.</p>";
    const NEU = "<p>Das Ferienheim Albin in Brigels ist unser Zuhause während der Lagerwoche. Hier essen wir gemeinsam und verbringen die Abende mit Spielen und Lagerprogramm.</p>";
    let seite;
    try {
      seite = app.findFirstRecordByFilter("seiten", 'slug = "lagerhaus"');
    } catch {
      return; // Ohne Datensatz zeigt die Website den Standardtext.
    }
    if (seite.getString("inhalt") === ALT) {
      seite.set("inhalt", NEU);
      app.save(seite);
    }
  },
  () => {}
);
