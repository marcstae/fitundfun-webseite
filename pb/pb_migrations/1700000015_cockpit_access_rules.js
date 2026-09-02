/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const EDITOR =
      '@request.auth.rolle = "editor" && @request.auth.muss_passwort_aendern = false';

    const lager = app.findCollectionByNameOrId("lager");
    lager.listRule = `status != "entwurf" || (${EDITOR})`;
    lager.viewRule = lager.listRule;
    app.save(lager);

    const dokumente = app.findCollectionByNameOrId("dokumente");
    dokumente.listRule = `lager.status != "entwurf" || (${EDITOR})`;
    dokumente.viewRule = dokumente.listRule;
    app.save(dokumente);

    for (const name of ["dokumente_intern", "fotoalben"]) {
      const collection = app.findCollectionByNameOrId(name);
      collection.listRule =
        `(@request.auth.rolle = "familie" && lager.status != "entwurf") || (${EDITOR})`;
      collection.viewRule = collection.listRule;
      app.save(collection);
    }

    const familienzugang = app.findCollectionByNameOrId("familienzugang");
    familienzugang.listRule = `@request.auth.rolle = "familie" || (${EDITOR})`;
    familienzugang.viewRule = familienzugang.listRule;
    app.save(familienzugang);
  },
  (app) => {
    const lager = app.findCollectionByNameOrId("lager");
    lager.listRule = 'status != "entwurf" || @request.auth.rolle = "editor"';
    lager.viewRule = lager.listRule;
    app.save(lager);

    const dokumente = app.findCollectionByNameOrId("dokumente");
    dokumente.listRule = 'lager.status != "entwurf" || @request.auth.rolle = "editor"';
    dokumente.viewRule = dokumente.listRule;
    app.save(dokumente);

    for (const name of ["dokumente_intern", "fotoalben"]) {
      const collection = app.findCollectionByNameOrId(name);
      collection.listRule =
        '(@request.auth.id != "" && lager.status != "entwurf") || @request.auth.rolle = "editor"';
      collection.viewRule = collection.listRule;
      app.save(collection);
    }

    const familienzugang = app.findCollectionByNameOrId("familienzugang");
    familienzugang.listRule = '@request.auth.id != ""';
    familienzugang.viewRule = '@request.auth.id != ""';
    app.save(familienzugang);
  }
);
