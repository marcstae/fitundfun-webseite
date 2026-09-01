/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // Editor-Default-Passwort ist im öffentlichen Repo bekannt: Schreibzugriff
    // erst nach dem erzwungenen Passwortwechsel (Flag muss_passwort_aendern = false).
    const EDITOR =
      '@request.auth.rolle = "editor" && @request.auth.muss_passwort_aendern = false';

    for (const name of [
      "lager",
      "dokumente",
      "dokumente_intern",
      "seiten",
      "archiv",
      "sponsoren",
      "links",
      "kontakte",
      "einstellungen",
    ]) {
      const collection = app.findCollectionByNameOrId(name);
      collection.createRule = EDITOR;
      collection.updateRule = EDITOR;
      collection.deleteRule = EDITOR;
      app.save(collection);
    }

    // Anonymes Löschen/Ändern von Einstellungen verbieten (war deleteRule "" = öffentlich).
    const einstellungen = app.findCollectionByNameOrId("einstellungen");
    einstellungen.deleteRule = EDITOR;
    einstellungen.updateRule = EDITOR;
    app.save(einstellungen);

    // Self-Update des Admin-Kontos: Rolle unveränderlich, Flag darf nur mit
    // aktuellem Passwort (oldPassword) gelöscht werden — sonst wäre der
    // erzwungene Passwortwechsel per API umgehbar.
    const users = app.findCollectionByNameOrId("users");
    users.updateRule =
      'id = @request.auth.id' +
      ' && (@request.body.rolle = "" || @request.body.rolle = @request.auth.rolle)' +
      ' && (@request.auth.muss_passwort_aendern = false' +
      '     || @request.body.muss_passwort_aendern = true' +
      '     || @request.body.oldPassword != "")';

    // Self-Management nur für Editoren (verhindert E-Mail-/verified-Selbständerung
    // durch das Familienkonto), aber nie fürs eigene Flag-Bypass-Konto.
    users.manageRule = '@request.auth.rolle = "editor" && id = @request.auth.id';
    app.save(users);
  },
  (app) => {
    const EDITOR = '@request.auth.rolle = "editor"';
    for (const name of [
      "lager",
      "dokumente",
      "dokumente_intern",
      "seiten",
      "archiv",
      "sponsoren",
      "links",
      "kontakte",
      "einstellungen",
    ]) {
      const collection = app.findCollectionByNameOrId(name);
      collection.createRule = EDITOR;
      collection.updateRule = EDITOR;
      collection.deleteRule = EDITOR;
      app.save(collection);
    }
    const einstellungen = app.findCollectionByNameOrId("einstellungen");
    einstellungen.deleteRule = "";
    app.save(einstellungen);

    const users = app.findCollectionByNameOrId("users");
    users.updateRule =
      'id = @request.auth.id && (@request.body.rolle = "" || @request.body.rolle = @request.auth.rolle)';
    users.manageRule = "id = @request.auth.id";
    app.save(users);
  }
);