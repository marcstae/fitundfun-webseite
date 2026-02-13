# Fit & Fun Familien Lager Website

Website für das Fit & Fun Familien Skilager in Brigels mit Admin-Panel.

## Tech Stack

- **Frontend:** Nuxt 3, Vue 3, Tailwind CSS, shadcn-vue
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Deployment:** Docker Compose

## Lokale Entwicklung

### Voraussetzungen

- Node.js 20+
- npm
- Docker & Docker Compose

### Setup

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Environment-Variablen:**
   ```bash
   cp .env.example .env
   # .env Datei anpassen
   ```

3. **Supabase starten:**
   ```bash
   docker compose up -d db auth rest storage kong
   ```

4. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

5. **Browser öffnen:** http://localhost:3000

## Produktion (Docker)

### Vollständiger Stack starten

```bash
# Environment anpassen
cp .env.example .env
nano .env  # Secrets ändern!

# Alle Container starten
docker compose up -d

# Logs anzeigen
docker compose logs -f
```

### URLs

- **Website:** http://localhost:3000
- **Supabase API:** http://localhost:8000
- **Supabase Studio:** http://localhost:3001

## Admin-Benutzer erstellen

1. Supabase Studio öffnen: http://localhost:3001
2. Authentication → Users → "Add User"
3. E-Mail und Passwort setzen
4. Login unter: http://localhost:3000/admin/login

## Projektstruktur

```
fitundfun/
├── components/         # Vue Komponenten
│   └── ui/            # shadcn-vue Komponenten
├── composables/       # Vue Composables
├── layouts/           # Nuxt Layouts
├── middleware/        # Route Middleware
├── pages/             # Seiten (File-based Routing)
│   ├── admin/         # Admin-Panel
│   └── archiv/        # Archiv-Seiten
├── public/            # Statische Dateien
├── server/            # Server API Routes
├── volumes/           # Docker Volumes
│   ├── db/init/       # DB Init Scripts
│   └── kong/          # Kong Config
├── docker-compose.yml
├── Dockerfile
└── nuxt.config.ts
```

## Datenbank-Schema

- `settings` - Website-Einstellungen
- `lager` - Lager (aktuell + Archiv)
- `lager_downloads` - PDF-Downloads pro Lager
- `lagerhaus` - Lagerhaus-Infos
- `sponsoren` - Sponsoren
- `kontakt_nachrichten` - Kontaktanfragen

## Storage Buckets

- `pdfs` - PDF-Dokumente
- `images` - Bilder (Hero, Lagerhaus, Sponsoren-Logos)

## Befehle

```bash
# Development
npm run dev

# Build
npm run build

# Preview Build
npm run preview

# Docker Build
docker compose build web

# Docker Start
docker compose up -d

# Docker Stop
docker compose down

# Docker Logs
docker compose logs -f web
```
