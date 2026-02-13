# Fit & Fun Website - Design Dokument

## Übersicht

Neue Website für das "Fit & Fun Familien Lager" - ein jährliches Skilager in Brigels. Die Website ist primär für bestehende Teilnehmer gedacht (invite-only), nicht für Marketing.

**Ziele:**
- Mobile-freundlich
- Minimalistisch, schneller Zugang zu Infos
- Admin-Panel für die Lagerleitung
- Self-hosted im Homelab

---

## Technische Architektur

```
┌─────────────────────────────────────────────────────────┐
│  HOMELAB - Docker Compose (ein Stack)                   │
│                                                         │
│  ┌─────────────────┐                                   │
│  │  fitundfun-web  │  Nuxt 3 App                       │
│  │  Port 3000      │                                   │
│  └────────┬────────┘                                   │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Supabase Stack                                  │   │
│  │  • PostgreSQL (Datenbank)                       │   │
│  │  • Auth (Authentifizierung)                     │   │
│  │  • Storage (PDFs + Website-Bilder)              │   │
│  │  • REST API                                      │   │
│  │  • Studio (DB Admin UI)                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Extern: Immich (Lager-Fotoalben)                      │
└─────────────────────────────────────────────────────────┘
```

### Technologie-Stack

| Komponente | Technologie |
|------------|-------------|
| Frontend | Nuxt 3 |
| Styling | Tailwind CSS + shadcn-vue |
| Backend | Supabase (self-hosted) |
| Datenbank | PostgreSQL (via Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Fotoalben | Immich (extern verlinkt) |
| Deployment | Docker Compose |
| Sprache | Nur Deutsch |

---

## Datenbank-Schema

```sql
-- Website-Einstellungen (Singleton)
settings
├── id (PK)
├── site_title
├── hero_image_url
└── contact_email

-- Lager (aktuell + Archiv)
lager
├── id (PK)
├── jahr
├── titel
├── datum_von
├── datum_bis
├── beschreibung
├── preis
├── immich_album_url
└── ist_aktuell (boolean)

-- PDF-Downloads pro Lager
lager_downloads
├── id (PK)
├── lager_id (FK → lager)
├── titel
├── file_path
└── reihenfolge

-- Lagerhaus-Informationen
lagerhaus
├── id (PK)
├── titel
├── beschreibung
└── bilder (JSON Array von URLs)

-- Sponsoren
sponsoren
├── id (PK)
├── name
├── logo_url
├── website_url
└── reihenfolge

-- Kontakt-Nachrichten
kontakt_nachrichten
├── id (PK)
├── name
├── email
├── nachricht
├── erstellt_am
└── gelesen (boolean)
```

---

## Seitenstruktur

### Öffentliche Seiten

| Route | Beschreibung |
|-------|--------------|
| `/` | Startseite mit Hero, Quick-Links |
| `/lager` | Aktuelles Lager mit Downloads |
| `/archiv` | Übersicht vergangener Lager |
| `/archiv/[jahr]` | Detail eines vergangenen Lagers |
| `/lagerhaus` | Infos über Lagerhaus Crestneder |
| `/sponsoren` | Sponsoren-Logos |
| `/kontakt` | Kontaktformular |

### Admin-Panel (`/admin/*`)

| Route | Beschreibung |
|-------|--------------|
| `/admin` | Dashboard |
| `/admin/lager` | Lager verwalten |
| `/admin/downloads` | PDFs verwalten |
| `/admin/lagerhaus` | Lagerhaus-Text/Bilder |
| `/admin/sponsoren` | Sponsoren verwalten |
| `/admin/nachrichten` | Kontaktanfragen |
| `/admin/settings` | Website-Einstellungen |

---

## UI Design

### Farbpalette "Alpin-Frisch"

```
PRIMÄR
┌─────────┐ ┌─────────┐ ┌─────────┐
│ #1E3A5F │ │ #2C5282 │ │ #3B82F6 │
│ Tiefblau│ │ Mittel  │ │ Hell    │
│ Header, │ │ Hover   │ │ Links   │
│ Footer  │ │         │ │         │
└─────────┘ └─────────┘ └─────────┘

AKZENT
┌─────────┐ ┌─────────┐
│ #F97316 │ │ #FDBA74 │
│ Orange  │ │ Hell    │
│ CTAs,   │ │ Hover   │
│ Buttons │ │         │
└─────────┘ └─────────┘

NEUTRAL
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ #FFFFFF │ │ #F8FAFC │ │ #64748B │ │ #1E293B │
│ Weiss   │ │ Grau-BG │ │ Text 2  │ │ Text 1  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### Typografie

| Element | Font | Gewicht | Grösse Desktop | Grösse Mobile |
|---------|------|---------|----------------|---------------|
| H1 (Hero) | Inter | Bold (700) | 48px | 32px |
| H2 (Sections) | Inter | Semibold (600) | 32px | 24px |
| Body | Inter | Regular (400) | 16px | 16px |
| Small/Labels | Inter | Medium (500) | 14px | 14px |

### Design-Prinzipien

- Mobile-first
- Viel Whitespace
- Grosse Klickflächen
- Fotos als Stimmungsgeber (eigene Lagerfotos)
- Minimaler Text, keine Marketing-Floskeln
- Wichtigstes zuerst

---

## Projektstruktur

```
fitundfun/
├── docker-compose.yml        # Supabase + Nuxt
├── Dockerfile
├── nuxt.config.ts
├── package.json
│
├── assets/
│   └── css/
│       └── main.css
│
├── components/
│   ├── ui/                   # shadcn-vue
│   ├── AppHeader.vue
│   ├── AppFooter.vue
│   ├── LagerCard.vue
│   ├── DownloadCard.vue
│   └── SponsorLogo.vue
│
├── composables/
│   └── useSupabase.ts
│
├── layouts/
│   ├── default.vue           # Öffentlich
│   └── admin.vue             # Admin mit Sidebar
│
├── middleware/
│   └── auth.ts
│
├── pages/
│   ├── index.vue
│   ├── lager.vue
│   ├── archiv/
│   │   ├── index.vue
│   │   └── [jahr].vue
│   ├── lagerhaus.vue
│   ├── sponsoren.vue
│   ├── kontakt.vue
│   └── admin/
│       ├── index.vue
│       ├── lager.vue
│       ├── downloads.vue
│       ├── lagerhaus.vue
│       ├── sponsoren.vue
│       ├── nachrichten.vue
│       └── settings.vue
│
├── server/
│   └── api/
│
└── public/
    └── favicon.ico
```

---

## Docker Setup

### docker-compose.yml (vereinfacht)

```yaml
services:
  # Nuxt App
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SUPABASE_URL=http://kong:8000
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
    depends_on:
      - kong

  # Supabase Services
  # (PostgreSQL, Auth, Storage, REST, Realtime, Studio, Kong)
  # Siehe: https://supabase.com/docs/guides/self-hosting/docker
```

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.output .output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

---

## Authentifizierung

- Einzelner Admin-Account
- Supabase Auth mit Email/Passwort
- Admin-Routen geschützt durch Nuxt Middleware
- Session-basiert

---

## Storage

### Supabase Storage Buckets

| Bucket | Inhalt | Zugriff |
|--------|--------|---------|
| `pdfs` | Lager-Downloads | Öffentlich (read) |
| `images` | Website-Bilder, Logos | Öffentlich (read) |

Upload nur durch authentifizierten Admin.

### Externe Medien

- Lager-Fotoalben: Immich (nur Links in DB gespeichert)

---

## Nächste Schritte

1. Nuxt 3 Projekt initialisieren
2. Supabase Docker Setup
3. Datenbank-Schema erstellen
4. Basis-Layout und Navigation
5. Öffentliche Seiten
6. Admin-Panel
7. Datei-Upload Integration
8. Testing
9. Deployment
