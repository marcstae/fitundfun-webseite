/// <reference path="../pb_data/types.d.ts" />
// Backups fürs Cockpit (/admin/backups). PocketBase sichert im laufenden Betrieb: die Datenbank per
// VACUUM INTO (Schreibsperre nur Millisekunden), dazu alle Uploads, ohne Stopp. Ziel ist pb_data/backups,
// dort hängt docker-compose den Ordner BACKUP_DIR ein. Die Routen prüfen die Cockpit-Regel, so braucht
// es keinen Superuser.

onBootstrap((e) => {
  e.next(); // danach ist die Datenbank offen; die JS-Migrationen laufen erst nach diesem Hook

  // PocketBase plant in UTC; so läuft «03:00» auch nach der Zeitumstellung um 03:00 Schweizer Zeit.
  $app.cron().setTimezone(new Timezone("Europe/Zurich"));
  // Daran erkennt das Cockpit, dass eine Wiederherstellung PocketBase neu gestartet hat.
  $app.store().set("fitundfun_gestartet", new Date().toISOString());

  // Wiederherstellen ohne die alte .env: Im Backup hat das Familienkonto das Passwort des damaligen
  // FAMILY_ACCESS_SECRET. Bei jedem Start auf das aktuelle abgleichen, sonst bleibt Geschütztes zu.
  // Ist das Konto noch nicht da (frische Installation), legen es die Migrationen 7 und 16 richtig an.
  const secret = $os.getenv("FAMILY_ACCESS_SECRET");
  if (secret.length < 32) return; // z. B. CLI-Aufruf ohne Umgebung
  try {
    const konto = $app.findAuthRecordByEmail("users", $os.getenv("FAMILY_ACCESS_EMAIL") || "familie@fitundfun.local");
    if (!konto.validatePassword(secret)) {
      konto.setPassword(secret);
      $app.save(konto);
      console.log("fitundfun: Familienkonto auf das aktuelle FAMILY_ACCESS_SECRET gesetzt");
    }
  } catch (err) {
    console.log("fitundfun: Familienkonto nicht abgeglichen:", err);
  }
});

routerAdd("GET", "/api/backup", (e) => {
  const b = require(`${__hooks}/backup.js`);
  b.nurCockpit(e.auth);
  const settings = $app.settings();
  const fsys = $app.newBackupsFilesystem();
  try {
    return e.json(200, {
      // Nur Zips: Im Ordner können auch andere Dateien liegen (z. B. .DS_Store vom NAS).
      backups: fsys.list("").filter((datei) => b.ZIP.test(datei.key)).map((datei) => ({
        name: datei.key,
        groesse: datei.size,
        datum: new Date(datei.modTime.unixMilli()).toISOString(),
      })),
      cron: settings.backups.cron,
      behalten: settings.backups.cronMaxKeep,
      ort: $os.getenv("BACKUP_ORT"),
      laeuft: $app.store().has("@activeBackup"),
      gestartet: $app.store().get("fitundfun_gestartet"),
    });
  } finally {
    fsys.close();
  }
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/backup", (e) => {
  const b = require(`${__hooks}/backup.js`);
  b.nurCockpit(e.auth);
  const name = `manuell_${b.zeitstempel()}.zip`;
  b.sichern(name);
  return e.json(200, { name });
}, $apis.requireAuth("users"));

routerAdd("PUT", "/api/backup/zeitplan", (e) => {
  require(`${__hooks}/backup.js`).nurCockpit(e.auth);
  const { cron, behalten } = e.requestInfo().body;
  // Nur, was das Cockpit anbietet: aus, täglich oder wöchentlich zu einer Uhrzeit.
  const erlaubt = /^([0-9]|[1-5][0-9]) ([0-9]|1[0-9]|2[0-3]) \* \* (\*|[0-6])$/;
  if (typeof cron !== "string" || (cron !== "" && !erlaubt.test(cron))) {
    throw new BadRequestError("Ungültiger Zeitplan.");
  }
  if (!Number.isInteger(behalten) || behalten < 1 || behalten > 60) {
    throw new BadRequestError("Anzahl automatischer Backups: 1 bis 60.");
  }
  const settings = $app.settings();
  settings.backups.cron = cron;
  settings.backups.cronMaxKeep = behalten;
  $app.save(settings);
  return e.json(200, { cron, behalten });
}, $apis.requireAuth("users"));

// Ohne requireAuth: Der Browser lädt per Link und weist sich mit einem kurzlebigen Datei-Token aus.
routerAdd("GET", "/api/backup/{name}", (e) => {
  const b = require(`${__hooks}/backup.js`);
  let konto = null;
  try {
    konto = $app.findAuthRecordByToken(e.request.url.query().get("token"), "file");
  } catch {}
  b.nurCockpit(konto);
  const name = b.backupName(e.request.pathValue("name"));
  const fsys = $app.newBackupsFilesystem();
  try {
    if (!fsys.exists(name)) throw new NotFoundError("Backup nicht gefunden.");
    // PocketBase setzt sonst max-age=30 Tage: Browser und Cloudflare hielten das ganze Backup samt
    // Token-URL vor, abrufbar auch nach Ablauf des Tokens.
    e.response.header().set("Cache-Control", "private, no-store");
    fsys.serve(e.response, e.request, name, name);
  } finally {
    fsys.close();
  }
});

routerAdd("DELETE", "/api/backup/{name}", (e) => {
  const b = require(`${__hooks}/backup.js`);
  b.nurCockpit(e.auth);
  const name = b.backupName(e.request.pathValue("name"));
  if ($app.store().get("@activeBackup") === name) throw new BadRequestError("Dieses Backup wird gerade verwendet.");
  const fsys = $app.newBackupsFilesystem();
  try {
    if (!fsys.exists(name)) throw new NotFoundError("Backup nicht gefunden.");
    fsys.delete(name);
  } finally {
    fsys.close();
  }
  return e.noContent(204);
}, $apis.requireAuth("users"));

// Kein Grössenlimit wie bei PocketBases eigenem Backup-Upload; requireAuth weist Fremde ab, bevor der
// Body gelesen wird. Über Cloudflare kommen trotzdem höchstens 100 MB durch.
routerAdd("POST", "/api/backup/hochladen", (e) => {
  const b = require(`${__hooks}/backup.js`);
  b.nurCockpit(e.auth);
  let datei = null;
  try {
    datei = e.findUploadedFiles("datei")[0];
  } catch {}
  if (!datei || !/\.zip$/i.test(datei.originalName)) throw new BadRequestError("Bitte eine .zip-Datei wählen.");
  const fsys = $app.newBackupsFilesystem();
  try {
    // Zufallsendung: Zwei Uploads in derselben Sekunde dürfen sich nicht überschreiben.
    const name = `hochgeladen_${b.zeitstempel()}_${$security.randomStringWithAlphabet(4, "abcdefghijkmnpqrstuvwxyz23456789")}.zip`;
    fsys.uploadFile(datei, name);
    return e.json(200, { name });
  } finally {
    fsys.close();
  }
}, $apis.bodyLimit(0), $apis.requireAuth("users"));

routerAdd("POST", "/api/backup/{name}/wiederherstellen", (e) => {
  const b = require(`${__hooks}/backup.js`);
  b.nurCockpit(e.auth);
  const name = b.backupName(e.request.pathValue("name"));
  const fsys = $app.newBackupsFilesystem();
  try {
    if (!fsys.exists(name)) throw new NotFoundError("Backup nicht gefunden.");
  } finally {
    fsys.close();
  }
  // Zuerst den aktuellen Stand sichern, damit sich die Wiederherstellung rückgängig machen lässt.
  b.sichern(`vor_wiederherstellung_${b.zeitstempel()}.zip`);
  // Antwort vor dem Neustart abschicken. restoreBackup ersetzt pb_data und startet PocketBase im selben
  // Prozess neu. Scheitert es (z. B. keine PocketBase-Sicherung), bleibt alles wie vorher und steht im Log.
  e.noContent(204);
  e.flush();
  try {
    $app.restoreBackup(new Context(), name);
  } catch (err) {
    console.log(`fitundfun: Wiederherstellung von ${name} fehlgeschlagen, Daten unverändert:`, err);
  }
}, $apis.requireAuth("users"));
