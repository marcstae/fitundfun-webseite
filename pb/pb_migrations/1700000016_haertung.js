/// <reference path="../pb_data/types.d.ts" />
// Härtung nach dem Audit vom November 2026 und E-Mail-Feld für Kontakte.
migrate(
  (app) => {
    // Geschützte Dokumente nur noch mit Datei-Token ausliefern; vorher war die Datei
    // über die PocketBase-Direkt-URL ohne Familienpasswort abrufbar.
    const intern = app.findCollectionByNameOrId("dokumente_intern");
    intern.fields.getByName("datei").protected = true;
    app.save(intern);

    // Hintergrundvideo: Das Limit war wegen eines falschen Optionsnamens (maxFilesize) 5 statt 60 MB.
    const einstellungen = app.findCollectionByNameOrId("einstellungen");
    einstellungen.fields.getByName("hero_video").maxSize = 62914560;
    app.save(einstellungen);

    const kontakte = app.findCollectionByNameOrId("kontakte");
    if (!kontakte.fields.getByName("email")) {
      kontakte.fields.add(new Field({ name: "email", type: "email" }));
      app.save(kontakte);
    }

    // Nur Editoren dürfen das eigene Konto ändern. Das gemeinsame Familienkonto konnte
    // sonst sein Passwort ändern und damit den Familienzugang für alle sperren.
    const users = app.findCollectionByNameOrId("users");
    users.updateRule =
      '@request.auth.rolle = "editor" && id = @request.auth.id' +
      ' && (@request.body.rolle = "" || @request.body.rolle = @request.auth.rolle)' +
      ' && (@request.auth.muss_passwort_aendern = false' +
      '     || @request.body.muss_passwort_aendern = true' +
      '     || @request.body.oldPassword != "")';
    app.save(users);

    // Das Familienkonto meldet sich neu mit einem internen Servergeheimnis an, das Familien
    // nie erhalten. Bisher war das Passwort aus dem verteilten Startpasswort ableitbar.
    // setPassword erneuert auch den tokenKey, alte Sitzungen dieses Kontos werden ungültig.
    const secret = $os.getenv("FAMILY_ACCESS_SECRET");
    if (!secret || secret.length < 32) {
      throw new Error(
        "FAMILY_ACCESS_SECRET muss gesetzt sein (mind. 32 zufällige Zeichen, z. B. `openssl rand -base64 48`)."
      );
    }
    const familyEmail = $os.getenv("FAMILY_ACCESS_EMAIL") || "familie@fitundfun.local";
    const family = app.findAuthRecordByEmail(users, familyEmail);
    family.setPassword(secret);
    app.save(family);

    // Passwort-Anmeldungen pro IP begrenzen (Schutz der Admin- und Familienkonten vor
    // Durchprobieren). Der Webserver cacht das Token des Familienkontos und fällt nicht darunter.
    const settings = app.settings();
    unmarshal(
      {
        rateLimits: {
          enabled: true,
          rules: [{ label: "*:authWithPassword", audience: "", duration: 60, maxRequests: 10 }],
        },
      },
      settings
    );
    app.save(settings);

    // Datenschutztext korrigieren, aber nur wenn er noch dem ursprünglichen Seed entspricht.
    const ALTER_TEXT =
      '<p>Diese Website verarbeitet nur Daten, die für den Betrieb und die Organisation des privaten Familienlagers erforderlich sind.</p><h2>Konten und Dokumente</h2><p>Login-Daten und Lagerdokumente werden in PocketBase gespeichert. Sensible Dokumente sind ausschliesslich für angemeldete Familienmitglieder und die Lagerleitung zugänglich.</p><h2>Server-Protokolle</h2><p>Beim Aufruf der Website können technisch notwendige Server-Protokolle wie IP-Adresse, Zeitpunkt und angeforderte Seite entstehen. Es werden keine Marketing- oder Analyse-Cookies eingesetzt.</p><h2>Externe Dienste</h2><p>Links zu Foto-Alben, Videos, Karten oder anderen Websites öffnen externe Anbieter. Für deren Datenverarbeitung gelten die jeweiligen Datenschutzerklärungen.</p><p>Fragen zum Datenschutz beantworten wir über die <a href="/kontakt">Kontaktseite</a>.</p>';
    const NEUER_TEXT =
      '<p>Diese Website verarbeitet nur Daten, die für den Betrieb und die Organisation des privaten Familienlagers erforderlich sind.</p><h2>Dokumente und Familienzugang</h2><p>Lagerdokumente werden auf unserem eigenen Server gespeichert. Geschützte Dokumente wie Teilnehmerliste und Zimmerplan sowie das Fotoalbum sind nur mit dem gemeinsamen Familienpasswort oder für die Lagerleitung zugänglich.</p><h2>Cookies</h2><p>Nach Eingabe des Familienpassworts speichert die Website ein technisch notwendiges Cookie ohne Personenbezug. Es ist bis zu 400 Tage gültig und lässt sich über die Browser-Einstellungen löschen. Für die Anmeldung der Lagerleitung wird ebenfalls ein technisch notwendiges Cookie gesetzt. Es werden keine Marketing- oder Analyse-Cookies eingesetzt.</p><h2>Server-Protokolle</h2><p>Beim Aufruf der Website können technisch notwendige Server-Protokolle wie IP-Adresse, Zeitpunkt und angeforderte Seite entstehen.</p><h2>Externe Dienste</h2><p>Links zu Fotoalben, Videos, Karten oder anderen Websites öffnen externe Anbieter. YouTube-Videos werden erst nach einem Klick geladen. Für deren Datenverarbeitung gelten die jeweiligen Datenschutzerklärungen.</p><p>Fragen zum Datenschutz beantworten wir über die <a href="/kontakt">Kontaktseite</a>.</p>';
    try {
      const seite = app.findFirstRecordByFilter("seiten", 'slug = "datenschutz"');
      if (seite.getString("inhalt") === ALTER_TEXT) {
        seite.set("inhalt", NEUER_TEXT);
        app.save(seite);
      }
    } catch {
      // Keine Datenschutzseite in der DB: Die Website zeigt dann ihren Standardtext.
    }
  },
  (app) => {
    const intern = app.findCollectionByNameOrId("dokumente_intern");
    intern.fields.getByName("datei").protected = false;
    app.save(intern);

    const users = app.findCollectionByNameOrId("users");
    users.updateRule =
      'id = @request.auth.id' +
      ' && (@request.body.rolle = "" || @request.body.rolle = @request.auth.rolle)' +
      ' && (@request.auth.muss_passwort_aendern = false' +
      '     || @request.body.muss_passwort_aendern = true' +
      '     || @request.body.oldPassword != "")';
    app.save(users);

    const settings = app.settings();
    unmarshal({ rateLimits: { enabled: false } }, settings);
    app.save(settings);
  }
);
