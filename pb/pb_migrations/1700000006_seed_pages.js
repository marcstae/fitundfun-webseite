/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("seiten");
    const pages = [
      {
        slug: "lagerhaus",
        titel: "Unser Lagerhaus",
        inhalt: "<p>Das Ferienheim Albin – Casa Crestneder ist seit vielen Jahren unser Zuhause während der Lagerwoche.</p><p>Hier schlafen, kochen, essen und verbringen wir die Abende gemeinsam. Das Haus liegt in Brigels und bietet kurze Wege ins Dorf und ins Wintersportgebiet.</p><ul><li>Ferienheim Albin, Casa Crestneder, 7165 Brigels</li><li>Gemeinschaftsräume für Essen, Spiele und Abendprogramm</li><li>Bettzeug ist vollständig vorhanden</li></ul>",
      },
      {
        slug: "impressum",
        titel: "Impressum",
        inhalt: "<p><strong>Verantwortlich für den Inhalt</strong><br>fit&amp;fun Familienlager Brigels<br>Lagerleitung: Andreas Locher</p><p>Fragen zur Website oder zum Lager beantworten wir über die <a href=\"/kontakt\">Kontaktseite</a>.</p><p>Die Website dient der Organisation und Dokumentation des privaten Familienlagers.</p>",
      },
      {
        slug: "datenschutz",
        titel: "Datenschutz",
        inhalt: "<p>Diese Website verarbeitet nur Daten, die für den Betrieb und die Organisation des privaten Familienlagers erforderlich sind.</p><h2>Konten und Dokumente</h2><p>Login-Daten und Lagerdokumente werden in PocketBase gespeichert. Sensible Dokumente sind ausschliesslich für angemeldete Familienmitglieder und die Lagerleitung zugänglich.</p><h2>Server-Protokolle</h2><p>Beim Aufruf der Website können technisch notwendige Server-Protokolle wie IP-Adresse, Zeitpunkt und angeforderte Seite entstehen. Es werden keine Marketing- oder Analyse-Cookies eingesetzt.</p><h2>Externe Dienste</h2><p>Links zu Foto-Alben, Videos, Karten oder anderen Websites öffnen externe Anbieter. Für deren Datenverarbeitung gelten die jeweiligen Datenschutzerklärungen.</p><p>Fragen zum Datenschutz beantworten wir über die <a href=\"/kontakt\">Kontaktseite</a>.</p>",
      },
    ];

    for (const page of pages) {
      try {
        app.findFirstRecordByFilter(collection, `slug = "${page.slug}"`);
      } catch {
        const record = new Record(collection);
        record.set("slug", page.slug);
        record.set("titel", page.titel);
        record.set("inhalt", page.inhalt);
        app.save(record);
      }
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("seiten");
    for (const slug of ["lagerhaus", "impressum", "datenschutz"]) {
      try {
        const record = app.findFirstRecordByFilter(collection, `slug = "${slug}"`);
        app.delete(record);
      } catch {}
    }
  }
);
