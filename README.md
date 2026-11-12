# fit&fun Website

Website des fit&fun Familienlagers in Brigels. Sie dient vor allem dazu, allen Familien schnell die Lagerdokumente zur Verfügung zu stellen. Die Lagerleitung pflegt alles im Cockpit unter `/admin`; eine Datenbank muss niemand bedienen.

## Admin-Cockpit

- **Übersicht:** nächstes Lager im Fokus, fehlende Angaben, Hinweis falls noch kein Lagerpasswort gesetzt ist
- **Lager:** Entwürfe, Veröffentlichung, Archiv; pro Lager Dokumente, Beschreibung, Aktivitäten, Fotoalbum, Video
- **Website:** Startseite und Lagerhaus
- **Organisation:** Kontakte (mit E-Mail für die Kontaktseite) und nützliche Links
- **Konto:** Admin-Passwort und Lagerpasswort

Dokumente:

- Neue Dokumente sind standardmässig **geschützt** (nur mit Lagerpasswort). Für Anmeldeformular, Programm usw. beim Hochladen «Für alle sichtbar» wählen.
- **Link kopieren** liefert einen dauerhaften Link für Mails. Er bleibt gültig, wenn später eine neue Fassung (z. B. Teilnehmerliste R2) über «Bearbeiten» hochgeladen wird. Dokumente öffnen sich in einem neuen Tab; bei geschützten fragt die Seite beim ersten Mal nach dem Lagerpasswort und merkt es sich auf dem Gerät.
- Hochladen, Ersetzen und Sortieren wird sofort gespeichert; Texte und Status mit «Speichern».

Ein neues Lager beginnt als Entwurf. Beim Veröffentlichen wird das bisher aktuelle Lager automatisch archiviert. Entwürfe sind nur im Cockpit und in der Vorschau sichtbar.

## Erstinstallation

1. `.env.example` nach `.env` kopieren und alle Platzhalter ersetzen. `FAMILY_ACCESS_SECRET` mit `openssl rand -base64 48` erzeugen. Dieses Geheimnis bekommen Familien **nie**.
2. `docker compose up -d --build` ausführen. PocketBase wendet die Migrationen beim Start automatisch an. Beim ersten Start werden die Dokumente 2011–2026 von der alten Jimdo-Seite übernommen (ca. 60 MB, rund eine Minute) und das Lager 2027 als Entwurf angelegt.
3. Mit `ADMIN_EMAIL` und `ADMIN_PASSWORD` unter `/admin` anmelden und das Startpasswort ändern.
4. Unter **Konto** das Lagerpasswort setzen und den Familien mitteilen. Vorher bleiben geschützte Dokumente für Familien verschlossen.

Die Daten liegen im Ordner `pb_data` neben der Compose-Datei. Der PocketBase-Container setzt die Besitzrechte beim Start selbst.

## Update einer bestehenden Installation (November 2026)

1. `pb_data` sichern (siehe unten).
2. In der `.env` die Zeile `FAMILY_ACCESS_PASSWORD=…` durch `FAMILY_ACCESS_SECRET=<openssl rand -base64 48>` ersetzen.
3. `git pull && docker compose up -d --build`
4. Im Cockpit unter **Konto** ein **neues** Lagerpasswort setzen und den Familien mitteilen. Das alte Startpasswort und bestehende Freischaltungen auf den Geräten gelten danach nicht mehr.

Lager, die bereits Dokumente haben, übergeht der Jimdo-Import. Es wird nichts überschrieben.

Hinweis: Beim Docker-Build läuft PocketBase noch nicht. Startseite und Lagerliste können deshalb nach einem Neubau bis zu 5 Minuten lang leer erscheinen, bis sie automatisch neu erzeugt werden.

## HTTPS / Reverse Proxy

- `NEXT_PUBLIC_PB_URL`, `SITE_URL` und `PB_ORIGINS` auf die öffentlichen `https://`-Adressen setzen und neu bauen (`docker compose up -d --build`). `NEXT_PUBLIC_PB_URL` wird beim Build eingebacken.
- Der Webserver spricht intern über `http://pb:8090` mit PocketBase (`PB_INTERNAL_URL` in `docker-compose.yml`).
- Upload-Limit des Proxys auf mindestens 60 MB stellen (nginx: `client_max_body_size 60m;`).
- Der Proxy soll die Client-IP setzen (nginx: `proxy_set_header X-Real-IP $remote_addr;`) und die Ports 3843/8090 nur lokal binden.

## Datensicherung

Alle Inhalte und Uploads liegen in `pb_data`. Ein Backup des Git-Repositories enthält keine Inhalte. Für eine konsistente Kopie PocketBase kurz anhalten:

```sh
docker compose stop pb && tar czf pb_data-$(date +%F).tgz pb_data && docker compose start pb
```

Wiederherstellen: `docker compose stop pb`, `pb_data` durch den Inhalt des Archivs ersetzen, `docker compose start pb`. Wiederherstellungen zuerst auf einer separaten Instanz testen.

## Notfall: Admin-Passwort vergessen oder zweites Editor-Konto

```sh
docker compose exec pb /pb/pocketbase superuser upsert notfall@example.ch '<temporäres-starkes-passwort>'
```

Danach `http://<host>:8090/_/` öffnen und anmelden. Unter *Collections → users* beim Konto der Lagerleitung ein temporäres Passwort setzen und `muss_passwort_aendern` einschalten. Für eine Stellvertretung kann dort ein zweiter Datensatz angelegt werden (`rolle` = editor, `verified` und `muss_passwort_aendern` eingeschaltet). Anschliessend den Notfallzugang wieder entfernen:

```sh
docker compose exec pb /pb/pocketbase superuser delete notfall@example.ch
```

Beim nächsten Login muss die Lagerleitung ein eigenes Passwort wählen.

## Wartung

- Vor jeder Lagersaison `npm audit --omit=dev` ausführen, Abhängigkeiten aktualisieren und neu bauen.
- PocketBase aktualisieren: `pb_data` sichern, `PB_VERSION` in `pb/Dockerfile` anheben, `docker compose build --pull pb && docker compose up -d pb`. Laut Upstream ist 0.40.6 die letzte Version auf GitHub; für neuere Versionen muss die Download-URL angepasst werden.
- Entwicklung: `npm run dev`, Prüfungen mit `npm test`, `npm run typecheck` und `npm run lint`.
