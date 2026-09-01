# Übergabe fit&fun Webseite — Stand nach Abschluss aller offenen Punkte

Stand: 2026-09-01. Alle To-dos aus der Implementierungsrunde sind abgeschlossen
und verifiziert. Diese Datei dient als Übergabeprotokoll.

## Abgeschlossen und verifiziert

- **Navigation**: Neue Hamburger-Navigation (Radix-Dialog) mit dynamischem
  Hauptpunkt „Lager 2026", „Frühere Lager", „Lagerhaus", „Kontakt"; sekundär
  Sponsoren · Admin-Login · Impressum · Datenschutz; Startseite über Logo + Text.
  Desktop und Mobile (390×844) geprüft, Scroll-Lock des Body funktioniert.
- **Familienzugang**: Passwort-Gate auf den Jahresseiten, dynamischer Text
  (Fotoalbum + Dokumente / nur Dokumente), Cookie httpOnly/SameSite=Lax,
  400 Tage (= Browser-Obergrenze), Rate-Limit (10 Versuche/IP/Stunde)
  mit „blockiert"-Hinweis. Falsches/korrektes Passwort, Cookies und
  PDF-Download (200/401) im Browser verifiziert.
- **Fotoalbum-Schutz**: Collection `fotoalben` (nur auth lesbar), Felder
  `immich_url`/`fotos_url` entfernt und vollständig migriert (alle Aufrufer
  angepasst). Editor-Setzen, anonymes Verbergen, Freischalten und Entfernen
  des Albums end-to-end verifiziert.
- **Sponsoren**: Dynamische Seite im Menü + Footer; Admin-Verwaltung
  (Name/URL/Logo) end-to-end verifiziert — angelegt, gerendert (öffentlich,
  Logo-Download 200), gelöscht. Dropzone-Fix für `image/*`-Uploads.
- **Route `/fotos` entfernt** → 404.
- **Code-Review-Fixes**: Passwort-Defaults aus Code/Compose entfernt
  (Fail-closed bei fehlender Env-Variable), Logging bei Auth-Fehlern,
  Rate-Limit, Scroll-Lock, Cookie-Secure-Flag über `x-forwarded-proto`,
  maxAge 400 Tage, Typ `LagerInhaltResult`.
- `npm run lint` und `npm run typecheck` sauber.
- Testdaten (Sponsoren, Fotoalbum) entfernt; Familienkonto-Rolle wieder `familie`.

## Geänderte/neue Dateien (letzter Stand)

- `src/components/site-header.tsx`, `site-footer.tsx`
- `src/app/layout.tsx`, `page.tsx`, `login/page.tsx`
- `src/app/lager/[jahr]/page.tsx`, `src/app/lager/page.tsx`
- `src/app/fotos/page.tsx` (gelöscht)
- `src/app/api/download/[collection]/[id]/[...path]/route.ts`
- `src/lib/family-access.ts` (neu), `data.ts`, `pb-types.ts`
- `src/components/edit/`: `editable-immich.tsx`, `editable-youtube.tsx`,
  `archiv-manager.tsx`, `neues-lager-wizard.tsx`, `dropzone.tsx`
- `pb/pb_migrations/1700000007_family_access.js` (neu)
- `pb/pb_migrations/1700000008_protect_photo_albums.js` (neu)
- `docker-compose.yml`, `.env.example`, `.env` (lokal, gitignored)
- `README-BETRIEB.md`, `ANLEITUNG-LAGERLEITER.md`, diese Datei

## Betriebshinweise (wichtig fürs Deployment)

- **`FAMILY_ACCESS_PASSWORD` muss auf dem Server gesetzt sein** (Pflicht,
  Fail-closed ohne sie). `FAMILY_ACCESS_EMAIL` optional.
- Das reale Passwort steht nirgends im Code oder in dieser Datei — nur in
  der Server-`.env`. Änderung am Passwort: `.env` + PB-interne
  Passwort-Neusetzung (`<wert>-internal`), Details in `README-BETRIEB.md`.
- Migration `1700000007` läuft nur beim ersten Start; sie synchronisiert
  das Passwort nicht bei jedem Neustart.
- Cookie-Laufzeit: 400 Tage (Chromium/Safari-Obergrenze). Für echte
  18 Monate wäre ein Refresh-Mechanismus nötig (nicht umgesetzt).
- Rate-Limit ist In-Memory pro Prozess (reicht bei einer Instanz;
  bei Multi-Instanz-Betrieb globalen Store nachrüsten).

## Bewusste Entscheidungen (nicht „reparieren")

- Kontaktseite zeigt nur Namen (kein Formular/E-Mail) — Wunsch des Betreibers.
- Kein Blog, keine Links-Seite, keine Sitemap im Menü.
- Sponsoren-Logos aus Jimdo sind nicht importiert; die Sammlung wird über
  den Bearbeitungsmodus gepflegt.
- `familyPocketBase()` authentifiziert pro Request (ponytail-Kommentar
  nennt den Upgrade-Pfad).