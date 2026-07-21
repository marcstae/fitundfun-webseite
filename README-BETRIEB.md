# fit&fun Lager Brigels — Betrieb

Selbst gehostete Website für das jährliche Familien-Skilager in Brigels.
Next.js (Frontend) + PocketBase (Backend), je ein Container.

## Schnellstart (lokal, ohne Docker)

```bash
cd fitundfun
cp .env.example .env
npm install
npm run dev          # http://localhost:3000
```

PocketBase lokal starten (separates Terminal):

```bash
cd pb
./pocketbase serve --http=127.0.0.1:8090
```

Beim ersten Start legt die Migration in `pb/pb_migrations/` automatisch alle
Collections an. Danach über das PB-Admin-UI (`http://127.0.0.1:8090/_/`)
mindestens einen `editor`-User anlegen (das ist der einzige Admin-Touchpoint).

## Deployment (Docker Compose)

```bash
# auf dem Server
git clone … && cd fitundfun
cp .env.example .env          # REVALIDATE_SECRET setzen!
docker compose up -d --build
```

Erreichbar unter `127.0.0.1:3000` (web) und `127.0.0.1:8090` (pb).
Der bestehende Reverse Proxy des Betreibers terminiert TLS und leitet
`fitundfun.ch → :3000` und `api.fitundfun.ch → :8090`.

### Reverse-Proxy-Beispiel (Caddy)

```
fitundfun.ch, www.fitundfun.ch {
  reverse_proxy 127.0.0.1:3000
}

api.fitundfun.ch {
  reverse_proxy 127.0.0.1:8090
  @admin path /_/*
  handle @admin { @block not remote_ip 10.0.0.0/8 192.168.0.0/16
    respond 403 }
}
```

PB-Admin-UI (`/_/`) im Reverse Proxy auf interne IPs beschränken.

## Ersteinrichtung (einmalig)

1. `docker compose up -d --build` → Collections werden automatisch angelegt.
2. PB-Admin: ersten Superuser anlegen (interne IP).
3. PB-Admin → Collection `users`: einen User mit Rolle `editor` anlegen
   (= Lagerleiter). Optional einen `familie`-User für die Familie.
4. Mit dem Editor-Login auf der Website einloggen → Bearbeitungsmodus →
   Hero-Video/Poster hochladen, Willkommenssatz setzen, erstes Lager anlegen.

## Backups

PocketBase-eigene Backups aktivieren: Admin → Settings → Backups
(täglich, 7 behalten). Zusätzlich empfohlen: `restic` oder `rsync` auf
das Volume `pb_data` auf Host-Ebene (Sache des Betreibers).

## Updates

- **PocketBase**: `PB_VERSION` in `pb/Dockerfile` erhöhen, vorher Backup,
  dann `docker compose up -d --build pb`.
- **Next.js**: Versionsnummern in `package.json` erhöhen,
  `docker compose up -d --build web`.

Vor Major-Updates immer ein Backup ziehen.

## Umgebungsvariablen

| Variable | Beschreibung |
|---|---|
| `NEXT_PUBLIC_PB_URL` | Öffentliche PocketBase-URL (z. B. `https://api.fitundfun.ch`) |
| `SITE_URL` | Öffentliche Website-URL (für SEO/sitemap) |
| `REVALIDATE_SECRET` | Optional: Server-to-Server-Revalidation-Secret |

## Architektur-Hinweise

- Öffentliche Seiten: Server Components mit ISR (`revalidate: 300`).
- On-Demand-Revalidation nach jedem Speichern via `/api/revalidate`.
- Sensible Dokumente liegen in der Collection `dokumente_intern`
  (Protected File). Öffentliche in `dokumente`. Die UI fasst beide
  zusammen; das `/api/download/…`-Routing prüft die Berechtigung.
- Rich-Text wird beim Rendern sanitized (Whitelist p/br/strong/em/ul/ol/li/a).
- YouTube wird via `youtube-nocookie.com` erst nach Klick geladen.
- Kein Tracking, keine Analytics.
