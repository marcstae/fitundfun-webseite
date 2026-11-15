<div align="center">

<img src="src/app/icon.png" width="88" alt="">

# fit&fun Website

**Dokumente, Infos und Fotos für ein Familien-Skilager in Brigels.**<br>
Gepflegt von einer Lagerleitung ohne Technikkenntnisse, betrieben auf einem Heimserver hinter einem Cloudflare Tunnel.

[![CI](https://github.com/marcstae/fitundfun-webseite/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/marcstae/fitundfun-webseite/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![PocketBase](https://img.shields.io/badge/PocketBase-0.40-B8DBE4?logo=pocketbase&logoColor=black)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?logo=docker&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare_Tunnel-F38020?logo=cloudflare&logoColor=white)

[**Live ansehen**](https://fitundfun.marcstaeuble.ch) · [Funktionen](#-funktionen) · [Architektur](#-architektur) · [DevOps](#-devops) · [Betrieb](#-betrieb)

<img src="docs/screenshots-handy.webp" alt="Startseite, Menü und Lagerseite mit Dokumenten auf dem Handy" width="100%">

</div>

Die Website ersetzt eine Jimdo-Seite. Über 100 Dokumente seit 2011 hat eine Datenmigration übernommen. Rund 80 % der Aufrufe kommen vom Handy, darum ist alles mobile-first gebaut: Die Dokumente des aktuellen Lagers sind zwei Fingertipps entfernt.

## ✨ Funktionen

| 👨‍👩‍👧 Für Familien | 🛠️ Für die Lagerleitung (Cockpit) |
|---|---|
| **Dokumente zuerst:** alle PDFs des Lagers auf einer Seite, mit einem Tipp geöffnet | **Übersicht:** Entwurf und aktives Lager im Fokus, fehlende Angaben auf einen Blick |
| **Lagerpasswort einmal pro Gerät:** schaltet geschützte Dokumente, Fotoalbum und Kontaktangaben für 400 Tage frei | **Lager-Lebenszyklus:** Entwurf → veröffentlicht → archiviert; die Datenbank erlaubt nur ein aktives Lager |
| **Links aus Mails bleiben gültig,** auch nach einer neuen Fassung; ohne Passwort erst zur Abfrage, dann direkt zur Datei | **Dokumente:** hochladen, neue Fassung ersetzen, sortieren, Link für Mails kopieren; neue Dokumente sind standardmässig geschützt |
| **Live-Schneehöhe** vom SLF-Messnetz und Countdown «Noch 86-mal schlafen» | **Inhaltsseiten:** Kontakte mit eigenen Gruppen und Sichtbarkeit pro Telefon und E-Mail, Lagerhaus, nützliche Links |
| **Kontakt mit Anruf-Links** (E.164), die Pistenrettung immer sichtbar | **Design ohne Code:** Startbild, Video und zwei Akzentfarben mit WCAG-Kontrastprüfung (≥ 4.5:1) |
| **Lagerhaus, Fotos und Video:** Route in Google Maps, Immich-Album, YouTube ohne Cookies | **Nichts geht verloren:** Rückfrage bei ungespeicherten Änderungen, auch beim Zurück-Knopf |

<p align="center"><img src="docs/screenshot-cockpit.webp" alt="Cockpit-Übersicht mit Entwurf und aktivem Lager" width="88%"></p>

## 🧱 Architektur

```mermaid
flowchart LR
  U["Familien und Lagerleitung"] -->|HTTPS| CF["Cloudflare Edge<br/>TLS, Bot-Schutz"]
  CF --> T["cloudflared<br/>ausgehender Tunnel"]
  subgraph H["Heimserver: Docker Compose"]
    T -->|"172.17.0.1:3843"| W["web: Next.js 16<br/>SSR, Server Actions"]
    T -->|"172.17.0.1:8090"| P["pb: PocketBase 0.40<br/>API, Auth, Dateien"]
    W -->|"intern pb:8090"| P
    P --- D[("pb_data<br/>SQLite und Uploads")]
    T --> M["Umami<br/>Statistik ohne Cookies"]
  end
  W -.->|"Cache 30 Min."| S["SLF-Messnetz<br/>Schneehöhe"]
```

Geschütztes verlässt PocketBase nie direkt Richtung Familien: `web` prüft das Lagerpasswort-Cookie und reicht Dateien selbst durch.

```mermaid
sequenceDiagram
  autonumber
  actor F as Familie
  participant W as web (Next.js)
  participant P as PocketBase
  F->>W: Link aus der Mail öffnen
  W->>W: Cookie prüfen (HMAC, Version des Passworts)
  alt noch nicht freigeschaltet
    W-->>F: 303 zur Passwortabfrage des Lagers
    F->>W: Lagerpasswort (Server Action, Limit pro IP)
    W->>P: Hash prüfen (scrypt) über ein internes Konto
    W-->>F: Cookie für 400 Tage, Datei öffnet sich direkt
  end
  W->>P: Datei mit Token des internen Kontos
  P-->>W: PDF
  W-->>F: PDF, ohne PocketBase-URL und Token
```

## 🔄 DevOps

| Praxis | Umsetzung | Wo |
|---|---|---|
| Continuous Integration | Typecheck, Lint, Unit-Tests, `npm audit` der Laufzeitpakete, Build und ein Browser-Test gegen das echte Next.js (headless Chrome über DevTools, ohne Test-Framework). Actions auf Commit-SHA gepinnt, nur Leserechte, zusätzlich jeden Montag. | [`ci.yml`](.github/workflows/ci.yml) |
| Abhängigkeiten | Dependabot wöchentlich für npm (gruppiert) und monatlich für Actions, neue Versionen erst nach 7 Tagen. Majors, die Next.js noch nicht trägt, bewusst ausgeschlossen. | [`dependabot.yml`](.github/dependabot.yml) |
| Container | Multi-Stage-Build mit `output: standalone`, Prozesse ohne Root-Rechte, Healthchecks, Log-Rotation (3 × 50 MB). | [`Dockerfile`](Dockerfile), [`pb/Dockerfile`](pb/Dockerfile) |
| Netzwerk | Ports nur an `127.0.0.1` und die Docker-Bridge gebunden, öffentlich nur über den Cloudflare Tunnel. Die Client-IP fürs Rate-Limit kommt aus `CF-Connecting-IP`. | [`docker-compose.yml`](docker-compose.yml) |
| Schema als Code | Über 30 PocketBase-Migrationen in JavaScript, nur angehängt, nie geändert; darunter die Übernahme von Jimdo. | [`pb/pb_migrations`](pb/pb_migrations) |
| Sicherheit | Zugriffsregeln pro Sammlung, Lagerpasswort als scrypt-Hash, signiertes Cookie, Limit von 10 Fehlversuchen pro IP und 50 insgesamt pro Stunde, Sicherheits-Header inklusive CSP. | [`family-access.ts`](src/lib/family-access.ts), [`next.config.mjs`](next.config.mjs) |
| Betrieb | Deploy nach grüner CI von Hand: bauen, Backup, starten, Cache neu aufbauen. Besucherstatistik selbst gehostet mit Umami, ohne Cookies und ohne Cockpit. | [Betrieb](#-betrieb), [`layout.tsx`](src/app/layout.tsx) |

> [!NOTE]
> **Bekannte Grenzen, bewusst in Kauf genommen und im Code mit `ponytail:` markiert**
> - Die Limits fürs Lagerpasswort liegen im Speicher eines Prozesses. Bei mehreren Instanzen bräuchte es einen geteilten Speicher.
> - Das globale Limit lässt sich missbrauchen, um das Freischalten bis zu einer Stunde für alle zu sperren. Das ist besser als unbegrenztes Durchprobieren.
> - Ein Gerät im Heimnetz mit einer von Hand gesetzten Route käme an die Bridge-Ports. Ganz dicht wäre ein gemeinsames Docker-Netz für cloudflared.
> - Für Admins ist das Lagerpasswort zusätzlich lesbar gespeichert, damit es im Cockpit angezeigt werden kann.

## 🧰 Betrieb

<details>
<summary><b>💻 Lokal entwickeln</b></summary>

```sh
FAMILY_ACCESS_SECRET=dev-… ADMIN_EMAIL=… ADMIN_PASSWORD=… pocketbase serve --migrationsDir=pb/pb_migrations
NEXT_PUBLIC_PB_URL=http://127.0.0.1:8090 SITE_URL=http://localhost:3000 REVALIDATE_SECRET=dev FAMILY_ACCESS_SECRET=dev-… npm run dev
```

- Vor jedem Commit `npm run typecheck`, `npm run lint` und `npm test`.
- Browser-Test lokal: `E2E=1 npm run build && E2E=1 npx next start -p 3100 &`, danach `node scripts/e2e-schutz.mjs http://localhost:3100`. Die Testseiten (`*.e2e.tsx`) kommen nur mit `E2E=1` in den Build.
- Schemaänderungen nur als **neue** Migration mit der nächsten Nummer. Bestehende sind auf dem Server gelaufen und bleiben unverändert, vorhandene Inhalte werden nie überschrieben.
- Diese Next.js-Version weicht von älteren ab: vorher `node_modules/next/dist/docs/` lesen.

</details>

<details>
<summary><b>🚀 Installation und Deploy</b></summary>

1. `.env.example` nach `.env` kopieren; `FAMILY_ACCESS_SECRET` und `REVALIDATE_SECRET` mit `openssl rand -base64 48` erzeugen.
2. `docker compose up -d --build`. Migrationen laufen bei jedem Start, der erste übernimmt die Jimdo-Dokumente (≈ 60 MB).
3. Mit `ADMIN_EMAIL` und `ADMIN_PASSWORD` anmelden; das Cockpit verlangt sofort ein eigenes Passwort.
4. Unter Konto das Lagerpasswort setzen, vorher bleibt Geschütztes zu.

`NEXT_PUBLIC_PB_URL` wird beim Build eingebacken; mit `SITE_URL` und `PB_ORIGINS` auf die öffentlichen HTTPS-Adressen setzen. Upload-Limit des Proxys ≥ 60 MB. Tunnel-Ziele: `http://172.17.0.1:3843` und `:8090`.

**Deploy, erst wenn CI grün ist:**

```sh
set -a; . ./.env; set +a                     # PB_DATA_DIR, REVALIDATE_SECRET laden
git pull && docker compose build --pull      # bauen, solange alles noch läuft
docker compose stop pb && cp -a "${PB_DATA_DIR:-./pb_data}" \
  "<backups>/pre-$(git rev-parse --short HEAD)-$(date -u +%Y%m%dT%H%M%SZ)"
docker compose up -d
curl -X POST localhost:3843/api/revalidate -H 'content-type: application/json' \
  -d "{\"secret\":\"$REVALIDATE_SECRET\",\"path\":\"/\"}"
```

> [!IMPORTANT]
> Das Backup ist Pflicht: Migrationen laufen beim Start von `pb` und lassen sich nicht zurücknehmen. Wiederherstellen heisst `pb` stoppen, Ordner zurückkopieren, starten. Ohne Revalidate zeigen Seiten bis zu 5 Minuten alte Daten, weil beim Build kein PocketBase läuft.

</details>

<details>
<summary><b>🧯 Wenn etwas nicht stimmt</b></summary>

| Symptom | Ursache und Lösung |
|---|---|
| Familien müssen das Passwort neu eingeben | Ein **neues** Lagerpasswort meldet alle Geräte ab; dasselbe erneut speichern nicht. |
| Link aus einer Mail: «Nicht gefunden» | Dokument gelöscht oder Sichtbarkeit gewechselt: Link neu kopieren. |
| Speichern im Cockpit scheitert | Sitzung abgelaufen: neu anmelden. |
| `/_/` will einen Superuser anlegen | Es gibt bewusst keinen; die Einrichtung braucht einen Token aus den Logs. Nur im Notfall anlegen. |

**Admin-Passwort vergessen:** `docker compose exec pb /pb/pocketbase superuser upsert notfall@example.ch '<temporär>'`, in `http://<host>:8090/_/` unter *users* ein temporäres Passwort setzen und `muss_passwort_aendern` einschalten (Stellvertretung: neuer Datensatz, `rolle` = editor, `verified`). Danach `superuser delete notfall@example.ch`.

</details>

<details>
<summary><b>🔧 Wartung</b></summary>

- Dependabot-Pull-Requests mergen, wenn CI grün ist, dann mit `--pull` deployen. Zurückgestellt, bis Next.js sie unterstützt: TypeScript 7, ESLint 10.
- `npm audit --omit=dev` muss 0 zeigen; Meldungen nur in Entwicklungswerkzeugen betreffen die Website nicht.
- PocketBase: `PB_VERSION` in `pb/Dockerfile` anheben. Laut Upstream ist 0.40.6 die letzte Version auf GitHub; für neuere die Download-URL anpassen.

</details>
