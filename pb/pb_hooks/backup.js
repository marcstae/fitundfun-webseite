// Hilfen für backup.pb.js. PocketBase führt jeden Hook isoliert aus, gemeinsamer Code geht nur per require().

/** Dieselbe Regel wie das Cockpit: Lagerleitung mit eigenem Passwort. */
function nurCockpit(konto) {
  if (
    !konto ||
    konto.collection().name !== "users" ||
    konto.get("rolle") !== "editor" ||
    konto.get("muss_passwort_aendern")
  ) {
    throw new ForbiddenError("Nur für die Lagerleitung.");
  }
}

const ZIP = /\.zip$/i;

/**
 * Zips im Backup-Ordner, auch von Hand abgelegte («Sicherung März (alt).zip»). Ausgeschlossen sind
 * Pfade: Der Name kommt dekodiert aus der URL, ein %2F wäre sonst ein Verzeichnistrenner.
 */
function backupName(name) {
  if (!ZIP.test(name || "") || name.length > 200 || /[\/\\\x00-\x1f]|\.\./.test(name) || name.startsWith(".")) {
    throw new BadRequestError("Ungültiger Backup-Name.");
  }
  return name;
}

/** 20261116_100151 (UTC), wie PocketBase seine automatischen Backups benennt. */
function zeitstempel() {
  return new Date().toISOString().replace(/[-:]/g, "").replace("T", "_").slice(0, 15);
}

/** PocketBase lässt nur ein Backup oder eine Wiederherstellung gleichzeitig zu. */
function sichern(name) {
  try {
    $app.createBackup(new Context(), name);
  } catch (err) {
    if (String(err).includes("try again later")) {
      throw new BadRequestError("Es läuft bereits ein Backup oder eine Wiederherstellung. Bitte kurz warten.");
    }
    throw new BadRequestError(`Backup fehlgeschlagen: ${err}`);
  }
}

module.exports = { nurCockpit, ZIP, backupName, zeitstempel, sichern };
