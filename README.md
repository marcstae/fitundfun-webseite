# fit&fun Website

## Admin-Cockpit

Das Cockpit liegt unter `/admin`. Inhalte werden ausschliesslich dort gepflegt; die öffentliche Website bleibt schreibgeschützt.

- **Übersicht:** Status und Vollständigkeit des aktuellen Lagers
- **Lager:** Entwürfe, Veröffentlichung, Archiv, Dokumente, Fotos, Videos, Preise und Aktivitäten
- **Website:** Startseite, Lagerhaus, Impressum und Datenschutz
- **Organisation:** Sponsoren, Kontakte und nützliche Links
- **Konto:** Admin- und Familienpasswort

Ein neues Lager beginnt als Entwurf. Beim Veröffentlichen wird das bisher aktuelle Lager automatisch archiviert. Entwürfe sind nur im Cockpit und in der geschützten Vorschau sichtbar.

## Deployment

1. `.env.example` nach `.env` kopieren und alle Platzhalter ersetzen.
2. `docker compose up -d --build` ausführen. PocketBase wendet Datenmigrationen beim Start automatisch an.
3. Mit `ADMIN_EMAIL` und `ADMIN_PASSWORD` unter `/admin` anmelden und das Startpasswort sofort ändern.
4. Unter **Konto** ein separates Familienpasswort setzen.

`FAMILY_ACCESS_PASSWORD` ist danach weiterhin ein internes Servergeheimnis und muss stabil bleiben. Das an Familien weitergegebene Passwort wird ausschliesslich im Cockpit geändert.

## Datensicherung

Alle redaktionellen Daten und Uploads liegen im Ordner `pb_data` neben der Compose-Datei. Diesen Ordner regelmässig und vor jedem Update sichern; ein Backup des Git-Repositories allein enthält keine Inhalte oder Uploads. Wiederherstellungen zuerst auf einer separaten Instanz testen.
