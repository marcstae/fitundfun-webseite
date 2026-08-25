/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    function recordExists(collection, filter) {
      try {
        app.findFirstRecordByFilter(collection, filter);
        return true;
      } catch {
        return false;
      }
    }

    function createRecord(collectionName, data) {
      const collection = app.findCollectionByNameOrId(collectionName);
      const record = new Record(collection);
      for (const [key, value] of Object.entries(data)) {
        record.set(key, value);
      }
      app.save(record);
      return record;
    }

    console.log("[seed] lager 2026");
    if (!recordExists("lager", "jahr = 2026")) {
      createRecord("lager", {
        jahr: 2026,
        titel: "fit&fun Familienlager Brigels",
        datum_von: "2026-01-31 00:00:00.000Z",
        datum_bis: "2026-02-07 00:00:00.000Z",
        beschreibung:
          "<p>31. Januar – 7. Februar 2026 im Ferienheim Albin (Casa Crestneder), Brigels. Bei genügend Leitenden sind von Sonntag bis Freitag Ski- und Snowboardgruppen geplant. Individuelle Anreise am Samstagnachmittag, Hausbezug ab 16 Uhr.</p><p>Die Wochenpauschale beinhaltet Unterkunft und drei Mahlzeiten täglich; Skipässe und Kurtaxen sind nicht inbegriffen. Das Lager findet nicht unter J+S statt.</p>",
        preise: [
          { label: "Erwachsene (ab 21)", preis: "510.- CHF" },
          { label: "Jugendliche (10-20)", preis: "430.- CHF" },
          { label: "Kinder (7-9)", preis: "400.- CHF" },
          { label: "Kinder (4-6)", preis: "170.- CHF" },
          { label: "Babys (0-3)", preis: "gratis" },
        ],
        aktivitaeten: [
          "Skifahren",
          "Snowboarden",
          "Schlitteln",
          "Schneeschuhlaufen",
          "Skirennen",
          "Fackelabfahrt",
          "Schnee-Bar",
          "Spieleabende",
          "Karaoke",
        ],
      });
    }

    console.log("[seed] archiv 2007-2025");
    const history = [
      {
        jahr: 2025,
        datum_von: "2025-02-01",
        datum_bis: "2025-02-08",
        teilnehmer: 77,
        preis: 510,
        beschreibung:
          "Das Familien-Wintersportlager 2025 plant bei genügend Leitenden Ski- und Snowboardgruppen sowie ein vielseitiges Abend- und Rahmenprogramm.",
        aktivitaeten: ["Skifahren", "Snowboarden", "Skirennen", "Fackelabfahrt", "Schneebar", "Spiele", "Kino", "Karaoke"],
      },
      {
        jahr: 2024,
        datum_von: "2024-02-03",
        datum_bis: "2024-02-10",
        teilnehmer: 69,
        preis: 510,
        beschreibung:
          "Das Familien-Wintersportlager 2024 plant bei genügend Leitenden Ski- und Snowboardgruppen sowie mehrere gemeinsame Freizeitaktivitäten.",
        aktivitaeten: ["Skifahren", "Snowboarden", "Skirennen", "Fackelabfahrt", "Schneebar", "Spiele", "Kino", "Karaoke"],
      },
      {
        jahr: 2023,
        datum_von: "2023-02-04",
        datum_bis: "2023-02-11",
        teilnehmer: 81,
        preis: 510,
        beschreibung:
          "Das Familien-Wintersportlager 2023 verbindet geplante Ski- und Snowboardgruppen mit Fackelabfahrt, Rennen und Freizeitprogramm. Nach zehn Jahren wurde die Wochenpauschale erstmals wieder um 20 CHF erhöht.",
        aktivitaeten: ["Skifahren", "Snowboarden", "Skirennen", "Fackelabfahrt", "Schneebar", "Spiele", "Kino", "Karaoke"],
      },
      {
        jahr: 2022,
        datum_von: "2022-02-05",
        datum_bis: "2022-02-12",
        teilnehmer: 69,
        preis: 490,
        beschreibung:
          "Das Familien-Wintersportlager 2022 fand unter COVID-Schutzkonzept statt und bot bei genügend Leitenden Ski- und Snowboardgruppen sowie ein gemeinsames Freizeitprogramm.",
        aktivitaeten: ["Skifahren", "Snowboarden", "Skirennen", "Fackelabfahrt", "Schneebar", "Spiele", "Kino", "Karaoke"],
      },
      {
        jahr: 2020,
        datum_von: "2020-02-01",
        datum_bis: "2020-02-08",
        teilnehmer: 78,
        preis: 490,
        beschreibung:
          "Das Familien-Wintersportlager 2020 plant Ski- und Snowboardgruppen sowie Fackelabfahrt, Rennen und weitere Freizeitangebote.",
        aktivitaeten: ["Skifahren", "Snowboarden", "Skirennen", "Fackelabfahrt", "Schneebar", "Spiele", "Kino", "Karaoke"],
      },
      {
        jahr: 2019,
        datum_von: "2019-02-02",
        datum_bis: "2019-02-09",
        teilnehmer: 73,
        preis: 490,
        beschreibung:
          "Das Familien-Wintersportlager 2019 plant Ski- und Snowboardgruppen sowie ein abwechslungsreiches gemeinsames Rahmenprogramm.",
        aktivitaeten: ["Skifahren", "Snowboarden", "Skirennen", "Fackelabfahrt", "Schneebar", "Spiele", "Kino", "Karaoke"],
      },
      {
        jahr: 2018,
        datum_von: "2018-02-03",
        datum_bis: "2018-02-10",
        teilnehmer: 57,
        preis: 490,
        beschreibung:
          "Das Familien-Wintersportlager 2018 kündigt Ski- und Snowboardgruppen sowie gemeinsame Schnee- und Freizeitaktivitäten an.",
        aktivitaeten: ["Skifahren", "Snowboarden", "Skirennen", "Fackelabfahrt", "Schneebar", "Spiele", "Kino", "Karaoke"],
      },
      {
        jahr: 2017,
        datum_von: "2017-02-04",
        datum_bis: "2017-02-11",
        teilnehmer: 69,
        preis: 490,
        beschreibung:
          "Das Familien-Wintersportlager 2017 plant bei genügend Leitenden geführte Ski- und Snowboardgruppen und mehrere Gemeinschaftsaktivitäten.",
        aktivitaeten: ["Skifahren", "Snowboarden", "Skirennen", "Fackelabfahrt", "Schneebar", "Spiele", "Kino", "Karaoke"],
      },
      {
        jahr: 2016,
        datum_von: "2016-02-06",
        datum_bis: "2016-02-13",
        teilnehmer: 53,
        preis: 490,
        beschreibung:
          "Das Familien-Wintersportlager 2016 plant geführte Ski- und Snowboardgruppen sowie Fackelabfahrt, Rennen und Freizeitangebote.",
        aktivitaeten: ["Skifahren", "Snowboarden", "Skirennen", "Fackelabfahrt", "Schneebar", "Spiele", "Kino"],
      },
      {
        jahr: 2015,
        datum_von: "2015-01-31",
        datum_bis: "2015-02-07",
        teilnehmer: 59,
        preis: 490,
        beschreibung:
          "Das Familien-Wintersportlager 2015 plant bei genügend Leitenden geführte Ski- und Snowboardgruppen sowie gemeinsame Freizeitaktivitäten.",
        aktivitaeten: ["Skifahren", "Snowboarden", "Skirennen", "Fackelabfahrt", "Schneebar", "Spiele", "Kino"],
      },
      {
        jahr: 2014,
        datum_von: "2014-02-01",
        datum_bis: "2014-02-08",
        teilnehmer: null,
        preis: 490,
        beschreibung:
          "Das Familien-Wintersportlager 2014 sieht am Sonntag freies Fahren und von Montag bis Freitag geführte Ski- und Snowboardgruppen vor.",
        aktivitaeten: ["Skifahren", "Snowboarden", "Skirennen", "Fackelabfahrt", "Schneebar", "Spiele", "Kino"],
      },
      {
        jahr: 2013,
        datum_von: "2013-02-02",
        datum_bis: "2013-02-09",
        teilnehmer: 58,
        preis: 490,
        beschreibung:
          "Das Familien-Wintersportlager 2013 kombiniert freies Fahren am Sonntag mit geführten Ski- und Snowboardgruppen von Montag bis Freitag.",
        aktivitaeten: ["Skifahren", "Snowboarden", "Skirennen", "Fackelabfahrt", "Schneebar", "Spiele", "Kino"],
      },
      {
        jahr: 2012,
        datum_von: "2012-02-04",
        datum_bis: "2012-02-11",
        teilnehmer: 49,
        preis: 490,
        beschreibung:
          "Das Familien-Wintersportlager 2012 verbindet freies Fahren am Sonntag mit geführten Ski- und Snowboardgruppen von Montag bis Freitag.",
        aktivitaeten: ["Skifahren", "Snowboarden", "Skirennen", "Fackelabfahrt", "Schneebar", "Spiele", "Kino"],
      },
      {
        jahr: 2011,
        datum_von: "2011-02-06",
        datum_bis: "2011-02-12",
        teilnehmer: 68,
        preis: null,
        beschreibung:
          "Die J+S-Schneesportwoche 2011 bot altersabhängigen Ski- und Snowboardunterricht sowie zahlreiche Schnee-, Sport- und Unterhaltungsangebote.",
        aktivitaeten: ["Skifahren", "Snowboarden", "Schlitteln", "Langlaufen", "Fackelabfahrt", "Kino", "Tanzen", "Volleyball", "Unihockey", "Basketball", "Baden"],
      },
      {
        jahr: 2010,
        datum_von: null,
        datum_bis: null,
        teilnehmer: null,
        preis: null,
        beschreibung: null,
        aktivitaeten: null,
      },
      {
        jahr: 2009,
        datum_von: null,
        datum_bis: null,
        teilnehmer: null,
        preis: null,
        beschreibung: "Kreativ-ultimatives Schneesportlager in Brigels mit Jugendlichen mit oder ohne ihre Familien.",
        aktivitaeten: null,
      },
      {
        jahr: 2008,
        datum_von: null,
        datum_bis: null,
        teilnehmer: null,
        preis: null,
        beschreibung: null,
        aktivitaeten: null,
      },
      {
        jahr: 2007,
        datum_von: null,
        datum_bis: null,
        teilnehmer: null,
        preis: null,
        beschreibung: "Das erste fit&fun Lager.",
        aktivitaeten: null,
      },
    ];

    for (const entry of history) {
      if (recordExists("archiv", `jahr = ${entry.jahr}`)) continue;
      createRecord("archiv", {
        jahr: entry.jahr,
        beschreibung: entry.beschreibung,
        datum_von: entry.datum_von ? `${entry.datum_von} 00:00:00.000Z` : null,
        datum_bis: entry.datum_bis ? `${entry.datum_bis} 00:00:00.000Z` : null,
        teilnehmer: entry.teilnehmer,
        preise: entry.preis ? [{ label: "Erwachsene", preis: `${entry.preis}.- CHF` }] : null,
        aktivitaeten: entry.aktivitaeten,
        quelle_url: `https://fitundfun.jimdofree.com/bisherige-lager/lager-${entry.jahr}/`,
      });
    }

    console.log("[seed] einstellungen");
    const einstellungen = app.findCollectionByNameOrId("einstellungen");
    let einstellungCount = 0;
    try {
      einstellungCount = app.countRecords(einstellungen);
    } catch {
      einstellungCount = 0;
    }
    if (einstellungCount === 0) {
      createRecord("einstellungen", {
        hero_titel: "fit&fun Lager Brigels",
        hero_willkommen:
          "Eine Woche Schnee, Sonne und Gemeinschaft — mit Familie und Freunden.",
      });
    }

    console.log("[seed] kontakte");
    if (!recordExists("kontakte", "rolle = 'Lagerleiter'")) {
      createRecord("kontakte", { rolle: "Lagerleiter", name: "Andreas Locher", sort: 1 });
    }

    console.log("[seed] links");
    const linksData = [
      { titel: "Brigels Tourismus", url: "http://www.brigels.ch", sort: 1 },
      { titel: "Schweiz Tourismus — Brigels", url: "http://www.myswitzerland.com/de/search/search.cfm?phrase=brigels", sort: 2 },
      { titel: "Therme Vals", url: "http://www.therme-vals.ch", sort: 3 },
      { titel: "SBB", url: "http://www.sbb.ch", sort: 4 },
    ];
    for (const link of linksData) {
      if (!recordExists("links", `url = "${link.url}"`)) {
        createRecord("links", link);
      }
    }

    console.log("[seed] Seed-Migration abgeschlossen.");
  },
  (app) => {
    for (const year of [2026]) {
      try {
        const lager = app.findCollectionByNameOrId("lager");
        const record = app.findFirstRecordByFilter(lager, `jahr = ${year}`);
        app.delete(record);
      } catch {}
    }
    for (const year of [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2022, 2023, 2024, 2025]) {
      try {
        const archiv = app.findCollectionByNameOrId("archiv");
        const record = app.findFirstRecordByFilter(archiv, `jahr = ${year}`);
        app.delete(record);
      } catch {}
    }
  }
);
