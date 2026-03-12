# Fit & Fun Familien Lager

Website for the **Fit & Fun Familien Lager** — a family ski camp held annually in Brigels, Graubunden, Switzerland since 2007.

## Repository Structure

```
fitundfun-mern/              # New website (MERN stack)
fitundfun.jimdofree.com/      # Old website (static HTML archive from Jimdo)
```

### `fitundfun.jimdofree.com/`

Static HTML scrape of the original website hosted on Jimdo. Kept as a reference archive for content and images from all past camps (2007–2025). This is the site being replaced.

### `fitundfun-mern/`

The modern replacement, built with the MERN stack.

## Tech Stack

| Layer        | Technology                                         |
| ------------ | -------------------------------------------------- |
| Frontend     | React 18, Vite, TypeScript                         |
| UI           | Tailwind CSS, shadcn/ui, Lucide icons              |
| Backend      | Express.js, Node.js 20                             |
| Database     | MongoDB 7 (Mongoose ODM)                           |
| Auth         | JWT (httpOnly cookies), bcrypt                      |
| File Storage | Local disk via Multer (images + PDFs)               |
| Validation   | Zod (client + server)                              |
| Deployment   | Docker Compose (3 services: MongoDB, Express, Nginx)|

## Features

**Public pages:** Home (animated hero), current camp, archive, camp house (Lagerhaus Crestneder), sponsors, contact form

**Admin panel:** Camp management (CRUD), PDF downloads per camp, camp house editor, sponsor management, message inbox, site settings, full backup/restore (ZIP)

**Security:** Rate limiting, CSRF protection, security headers (CSP, HSTS), input validation, file type/size checks

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB 7+ (local or Docker)

### Local Development

```bash
cd fitundfun-mern

# Install dependencies
cd server && npm install && cd ..
cd client && npm install && cd ..

# Start MongoDB (e.g. via Docker)
docker run -d --name mongo -p 27017:27017 mongo:7

# Seed database and create admin user
cd server
MONGODB_URI=mongodb://localhost:27017/fitundfun npm run seed
MONGODB_URI=mongodb://localhost:27017/fitundfun \
  ADMIN_EMAIL=admin@fitundfun.ch \
  ADMIN_PASSWORD=changeme \
  npm run create-admin

# Start server (port 4000)
MONGODB_URI=mongodb://localhost:27017/fitundfun \
  JWT_SECRET=your-secret-at-least-32-characters-long \
  CORS_ORIGIN=http://localhost:5173 \
  npm run dev

# Start client (port 5173) — in a separate terminal
cd ../client
VITE_API_URL=http://localhost:4000 npm run dev
```

Open http://localhost:5173 for the website, http://localhost:5173/admin/login for the admin panel.

### Docker Compose

```bash
cd fitundfun-mern

# Configure environment
cp .env.example .env
# Edit .env — set MONGO_PASSWORD, JWT_SECRET, ADMIN_PASSWORD

# Start all services
docker compose up --build

# Seed data (first run only)
docker compose exec server node dist/scripts/seed.js
docker compose exec server node dist/scripts/createAdmin.js
```

The site runs on http://localhost:3000, the API on http://localhost:4000.

## API Overview

| Method | Endpoint                         | Auth | Description                    |
| ------ | -------------------------------- | ---- | ------------------------------ |
| GET    | `/api/public/settings`           | No   | Site settings                  |
| GET    | `/api/public/lager/aktuell`      | No   | Current camp with downloads    |
| GET    | `/api/public/lager/archiv`       | No   | Past camps                     |
| GET    | `/api/public/lager/:jahr`        | No   | Camp by year                   |
| GET    | `/api/public/lagerhaus`          | No   | Camp house info                |
| GET    | `/api/public/sponsoren`          | No   | Sponsors                       |
| POST   | `/api/contact`                   | No   | Submit contact message         |
| POST   | `/api/auth/login`                | No   | Login (sets JWT cookie)        |
| POST   | `/api/auth/logout`               | No   | Logout (clears cookie)         |
| GET    | `/api/auth/me`                   | No   | Current user                   |
| *      | `/api/admin/**`                  | Yes  | Admin CRUD (lager, downloads, lagerhaus, sponsoren, nachrichten, settings, backup) |

## Database Collections

| Collection         | Description                      |
| ------------------ | -------------------------------- |
| `adminusers`       | Admin accounts (email + bcrypt hash) |
| `settings`         | Site title, contact email, hero image (singleton) |
| `lagers`           | Camp entries (year, dates, description, price) |
| `lagerdownloads`   | PDF files per camp               |
| `lagerhauses`      | Camp house info + images (singleton) |
| `sponsors`         | Sponsor name, logo, website, order |
| `kontaktnachrichts`| Contact form messages            |

## License

Private project.
