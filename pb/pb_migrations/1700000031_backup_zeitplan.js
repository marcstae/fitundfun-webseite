/// <reference path="../pb_data/types.d.ts" />
// Startwert für automatische Backups: täglich 03:00 Schweizer Zeit (Zeitzone in pb_hooks/backup.pb.js),
// die letzten 7 behalten. Nur ohne bestehenden Zeitplan; danach steuert das Cockpit (/admin/backups).
migrate(
  (app) => {
    const settings = app.settings();
    if (!settings.backups.cron) {
      settings.backups.cron = "0 3 * * *";
      settings.backups.cronMaxKeep = 7;
    }
    // Steht im Dateinamen der automatischen Backups (@auto_pb_backup_<name>_…zip).
    if (settings.meta.appName === "Acme") settings.meta.appName = "fitundfun";
    app.save(settings);
  },
  (app) => {
    const settings = app.settings();
    settings.backups.cron = "";
    app.save(settings);
  }
);
