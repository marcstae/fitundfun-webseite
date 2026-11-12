/// <reference path="../pb_data/types.d.ts" />
// Einmaliger Import von der alten Jimdo-Seite: Lagerdokumente 2011-2026.
// Überschreibt nichts: Lager, die schon Dokumente haben, werden übersprungen. Teilnehmerlisten und Zimmerpläne landen als geschützte Dokumente.
// Fehlgeschlagene Downloads werden nur geloggt (Start darf nicht an Jimdo hängen);
// solche Dateien lädt die Lagerleitung bei Bedarf im Cockpit nach.
migrate(
  (app) => {
    const JIMDO = "https://fitundfun.jimdofree.com";
    const DOWNLOAD = JIMDO + "/app/download/";

    // [Jahr, Name, Jimdo-Downloadpfad, geschützt]
    const DOKUMENTE = [
  [2026, "Zimmerplan 2026", "9267091014/2026+Zimmerplan+%28R1%29.pdf", true],
  [2026, "Teilnehmer 2026", "9266700214/2026+Teilnehmer+%28R2%29.pdf", true],
  [2026, "Reni Sport 2026", "9265526114/2026+Reni+Sport+Mietkonditionen.pdf", false],
  [2026, "Programm 2026", "9260131214/2026+Programm.pdf", false],
  [2026, "Anmeldung 2026", "9260131514/2026+Anmeldeformular.pdf", false],
  [2026, "Detaillierte Lagerinfos 2026", "9266741214/2026+Detaillierte+Lagerinfos+%28R1%29.pdf", false],
  [2026, "Letzte Information vor Lagerbeginn 2026", "9266741314/2026+Letzte+Info+%28R1%29.pdf", false],
  [2025, "2025 Zimmerplan", "9239197414/2025+Zimmerplan.pdf", true],
  [2025, "2025 Teilnehmer", "9239197514/2025+Teilnehmer.pdf", true],
  [2025, "2025 Sport Beat Mietkonditionen", "9238521214/2025+Sport+Beat+Mietkonditionen.pdf", false],
  [2025, "Lager Kurzbeschrieb", "9232436314/2025+Lager+Kurzbeschrieb.pdf", false],
  [2025, "Detaillierte Lager Informationen", "9232436414/2025+Detaillierte+Lagerinfos.pdf", false],
  [2025, "Programm", "9232436514/2025+Programm.pdf", false],
  [2025, "Anmeldeformular", "9232436614/2025+Anmeldeformular.pdf", false],
  [2024, "Zimmerplan", "9207757114/ZimmerPlan+2024.pdf", true],
  [2024, "Lagerteilnehmer", "9207478514/Teilnehmer+2024.pdf", true],
  [2024, "Sport Beat Mietkonditionen", "9207478814/Sport+Beat+Mietkonditionen+2024.pdf", false],
  [2024, "Lager Kurzbeschrieb", "9203265414/Lager+Kurzbeschrieb+2024.pdf", false],
  [2024, "Detaillierte Lager Informationen", "9203265814/Detailierte+Lagerinfos+2024.pdf", false],
  [2024, "Programm", "9203266214/Programm+2024.pdf", false],
  [2024, "Anmeldeformular", "9203267814/Anmeldeformular+2024.pdf", false],
  [2023, "Letzte Info 2023", "9160107414/Letzte+Info+2023.pdf", false],
  [2023, "Lagerteilnehmer 2023", "9160193114/Lagerteilnehmer+2023.pdf", true],
  [2023, "Zimmer Belegungsplan 2023", "9160108014/Zimmer+Belegungsplan+2023.pdf", true],
  [2023, "Lager Kurzbeschrieb 2023", "9156626414/Lager+Kurzbeschrieb+2023.pdf", false],
  [2023, "Detailierte Lagerinfos 2023", "9156626614/Detailierte+Lagerinfos+2023.pdf", false],
  [2023, "Programm 2023", "9156626914/Programm+2023.pdf", false],
  [2023, "Anmeldeformular 2023", "9156627314/Anmeldeformular+2023.pdf", false],
  [2023, "Sport Beat Mietkonditionen 2023", "9156627114/Sport+Beat+Mietkonditionen+2023.pdf", false],
  [2022, "Letzte Info 2022", "9099948214/Letzte+Info+2022.pdf", false],
  [2022, "F&F 2022 - COVID Schutzkonzept 20220119", "9100142614/F%26F+2022+-+COVID+Schutzkonzept+20220119.pdf", false],
  [2022, "Lagerteilnehmer 2022", "9099957414/Lagerteilnehmer+2022.pdf", true],
  [2022, "Zimmerplan 2022", "9100333214/Zimmerplan+2022.pdf", true],
  [2022, "Lager Kurzbeschrieb 2022", "9091222314/Lager+Kurzbeschrieb+2022.pdf", false],
  [2022, "Detailierte Lagerinfos 2022", "9091222714/Detailierte+Lagerinfos+2022.pdf", false],
  [2022, "Programm 2022", "9091222914/Programm+2022.pdf", false],
  [2022, "Anmeldeformular 2022", "9091235414/Anmeldeformular+2022.pdf", false],
  [2022, "Sport Beat Mietkonditionen 2022", "9091550314/Sport+Beat+Mietkonditionen+2022.pdf", false],
  [2020, "Letzte Informationen (bevor Anreise)", "8919421614/Letzte+Info+2020.pdf", false],
  [2020, "Mietkonditionen - Sport Beat", "8910783714/Sport+Beat+Mietkonditionen+2020.pdf", false],
  [2020, "Zimmer Belegungsplan 2020", "8916912814/ZimmerPlan+2020+R4.pdf", true],
  [2020, "Lagerteilnehmer 2020", "8916912614/Teilnehmer+2020-01-27.pdf", true],
  [2020, "Lagerprogramm 2020", "8860740414/Programm+2020.pdf", false],
  [2020, "Kurze Lagerbeschreibung", "8860738014/Kurzbeschrieb+2020.pdf", false],
  [2020, "Anmeldeformular", "8860738714/Anmeldung+2020.pdf", false],
  [2020, "Detaillierte Lagerinfos", "8860738914/Info+2020.pdf", false],
  [2019, "Letzt Infos vor Lagerbeginn", "8649195714/Letzte+Info+2019.pdf", false],
  [2019, "Lagerprogramm", "8594006514/Programm+2019.pdf", false],
  [2019, "Ausrüstung Mieten - Sport Beat", "8640984814/Ausr%C3%BCstung+Mieten+-+Sport+Beat+2019.pdf", false],
  [2019, "Zimmer Belegungsplan", "8637641714/ZimmerPlan+2019.pdf", true],
  [2019, "Teilnehmer Liste", "8649196714/Teilnehmer+2019.pdf", true],
  [2019, "Lager Kurzbeschrieb", "8593999714/Kurzbeschrieb+2019.pdf", false],
  [2019, "Lager Detail Informationen", "8594000114/Detail+Info+2019.pdf", false],
  [2019, "Anmeldeformular", "8594005914/Anmeldung+2019.pdf", false],
  [2019, "Flyer zum Aufhängen", "8594006914/Flyer+2019.pdf", false],
  [2018, "Letzte Lager Informationen", "8457864014/Letzte+Info+2018.pdf", false],
  [2018, "Lagerteilnehmer", "8457870614/Lagerteilnehmer+2018+%28Liste%29.pdf", true],
  [2018, "Zimmer Plan", "8457871014/ZimmerPlan+2018.pdf", true],
  [2018, "Lager Kurzbeschrieb", "8289362414/Kurzbeschrieb+2018.pdf", false],
  [2018, "Lager Detail Infos", "8289363014/Info+2018.pdf", false],
  [2018, "Anmeldeformular", "8289295214/Anmeldung+2018.pdf", false],
  [2018, "Lager Programm", "8289301714/Programm+2018.pdf", false],
  [2018, "Flyer zum Aufhängen", "8289302414/Flyer+2018.pdf", false],
  [2017, "Letzte Infos 2017", "7713738914/Letzte+Info+2017.pdf", false],
  [2017, "Programm 2017", "7670440014/Programm+2017.pdf", false],
  [2017, "Zimmer Belegungsplan 2017", "7699846614/ZimmerPlan+2017.pdf", true],
  [2017, "Lagerinfo 2017", "7670440914/Info+2017.pdf", false],
  [2017, "Anmeldeformular 2017", "7670435714/Anmeldung+2017.pdf", false],
  [2017, "Flyer für Aushang 2017", "7670441614/Flyer+2017.pdf", false],
  [2017, "Lagerkurzbeschrieb 2017", "7670441314/Kurzbeschrieb+2017.pdf", false],
  [2016, "Letzte Lager und Anreise Informationen 2016", "7512113414/Letzte+Info+2016.pdf", false],
  [2016, "Lagerteilnehmer 2016", "7512089214/Lagerteilnehmer+2016.pdf", true],
  [2016, "Zimmerbelegung 2016", "7512092014/Zimmerbelegung+2016.pdf", true],
  [2016, "Lager Kurzbeschrieb 2016", "7390414314/Kurzbeschrieb+2016.pdf", false],
  [2016, "Lager Programm 2016", "7390414514/Programm+2016+Programm.pdf", false],
  [2016, "Lager Information 2016", "7390414714/Info+2016.pdf", false],
  [2016, "Anmeldeformular 2016", "7390415014/Anmeldung+2016.pdf", false],
  [2016, "Flyer 2016 (für Anschlagbretter)", "7390415314/Flyer+2016.pdf", false],
  [2015, "Letzte Info 2015", "7372030214/Letzte+Info+2015.pdf", false],
  [2015, "Teilnehmer 2015", "7372029414/Teilnehmer+2015.pdf", true],
  [2015, "Programm 2015", "7372029614/Programm+2015.pdf", false],
  [2015, "Zimmerbelegung 2015", "7372029814/Zimmerbelegung+2015.pdf", true],
  [2015, "Lager Info 2015", "7369853514/Info+2015.pdf", false],
  [2015, "Anmeldeformular 2015", "7369853814/Anmeldung+2015.docx", false],
  [2015, "Lager Kurzbeschrieb 2015", "7369854014/Kurzbeschrieb+2015.pdf", false],
  [2015, "Flyer 2015 (für Anschlagbretter)", "7369854314/Flyer+2015.pdf", false],
  [2014, "Letzte Lager/Anreise Informationen 2014", "7362483014/Letzte+Info+2014.pdf", false],
  [2014, "Lagerprogramm 2014", "7359114814/Programm+2014.pdf", false],
  [2014, "Lagerteilnehmer 2014", "7362482114/Teilnhemer+2014.pdf", true],
  [2014, "Zimmer Belegungsplan 2014", "7362482214/Zimmerbelegung+2014.pdf", true],
  [2014, "Lagerinfo und Anmeldung 2014", "7359115114/Info+%2B+Anmeldung+2014.docx", false],
  [2014, "Lagerkurzbeschrieb für Neuzugänge", "7359114414/Kurzbeschrieb+2014.pdf", false],
  [2014, "Flyer für Anschlagbretter", "7359115514/Flyer+2014.pdf", false],
  [2013, "Letzte Lager Infos 2013", "4675802614/Letzte+Info+2013.docx", false],
  [2013, "Lager Programm 2013", "4670050214/Programm+2013.pdf", false],
  [2013, "Lagerteilnehmer", "4674510314/Teilnehmer.pdf", true],
  [2013, "Lagerinfo & Anmeldung 2013", "4669575014/Info+%2B+Anmeldung+2013.docx", false],
  [2013, "Lagerkurzbeschrieb für Neuzugänge", "4669575114/Kurzbeschrieb+2013.pdf", false],
  [2013, "Flyer für den Aushang am Anschlagbrett", "4669575214/Flyer+2013.pdf", false],
  [2012, "Letzte Lagerinfo", "4646782214/F%26F+Letzte+Lagerinfo.pdf", false],
  [2012, "Wochenprogramm Februar 2012", "4644078414/F%26F+Programm+2012.pdf", false],
  [2012, "Lagerteilnehmer, Leiter und Küchenteam", "4644091914/F%26F+Teilnehmer.pdf", true],
  [2012, "Lager Kurzbeschrieb", "4644078614/F%26F+Kurzbeschrieb.pdf", false],
  [2012, "Flyer", "4644078914/F%26F+Flyer.pdf", false],
  [2012, "Lager Vorinformationen und Anmeldetalon", "4641584614/VorInfo+%2B+Anmeldung.pdf", false],
  [2011, "Zimmerliste Stand 03.02.11", "4619375714/Zimmerliste.pdf", true],
  [2011, "Wochenplan", "4619272914/Wochenplan2011_110130+%282%29.pdf", false],
  [2011, "INFOS zum Lager 2011", "4619374114/Infos_101220.pdf", false],
  [2011, "Sollte es doch keinen Schnee mehr haben .....", "4619273214/Strickanleitung_Kappe_1101.pdf", false],
  [2011, "INFOS Leitende", "4619375514/Infos_Leitende_1101.pdf", true],
    ];


    const fehler = [];
    const jahre = [...new Set(DOKUMENTE.map((eintrag) => eintrag[0]))];

    for (const jahr of jahre) {
      let lager;
      try {
        lager = app.findFirstRecordByFilter("lager", "jahr = {:jahr}", { jahr });
      } catch {
        fehler.push(`Lager ${jahr} nicht gefunden`);
        continue;
      }
      const vorhanden = ["dokumente", "dokumente_intern"].some(
        (name) => app.findRecordsByFilter(name, "lager = {:id}", "", 1, 0, { id: lager.id }).length > 0
      );
      if (vorhanden) {
        console.log(`[jimdo] ${jahr}: hat bereits Dokumente, übersprungen`);
        continue;
      }

      let alleOk = true;
      DOKUMENTE.filter((eintrag) => eintrag[0] === jahr).forEach(([, name, pfad, geschuetzt], index) => {
        try {
          const record = new Record(app.findCollectionByNameOrId(geschuetzt ? "dokumente_intern" : "dokumente"));
          record.set("name", name);
          record.set("lager", lager.id);
          record.set("sensibel", geschuetzt);
          record.set("sort", index + 1);
          record.set("datei", $filesystem.fileFromURL(DOWNLOAD + pfad, 120));
          app.save(record);
        } catch (e) {
          alleOk = false;
          fehler.push(`${jahr} «${name}»: ${e}`);
        }
      });

      // Die Jimdo-Seiten ab 2011 enthalten nur diese Dokumente; der Link wäre nach der Abschaltung tot.
      if (alleOk && lager.getString("quelle_url").startsWith(JIMDO)) {
        try {
          lager.set("quelle_url", "");
          app.save(lager);
        } catch (e) {
          fehler.push(`${jahr} Quelle-Link: ${e}`);
        }
      }
      console.log(`[jimdo] ${jahr}: importiert${alleOk ? "" : " (mit Fehlern)"}`);
    }

    if (fehler.length) {
      console.log(`[jimdo] ${fehler.length} Einträge nicht importiert - bei Bedarf im Cockpit nachladen:\n` + fehler.join("\n"));
    }
  },
  () => {
    // Kein automatisches Zurückrollen: importierte Inhalte gehören danach der Lagerleitung.
  }
);
