# Datenbank Setup

## Leere Datenbank

Beim ersten Start mit `docker compose up` wird die Datenbank mit dem **Schema** initialisiert, aber **ohne Daten**.

Die Tabellen werden erstellt:
- `settings` - Website-Einstellungen
- `lager` - Lager-Einträge
- `lager_downloads` - Downloads pro Lager
- `lagerhaus` - Lagerhaus-Informationen
- `sponsoren` - Sponsoren
- `kontakt_nachrichten` - Kontaktformular-Nachrichten

## Admin-Benutzer erstellen

Nach dem ersten Start musst du einen Admin-Benutzer erstellen:

### Option 1: Supabase Studio (empfohlen)
1. Öffne http://localhost:3001 (Supabase Studio)
2. Gehe zu "Authentication" → "Users"
3. Klicke "Add User" → "Create New User"
4. E-Mail und Passwort eingeben
5. "Auto Confirm User" aktivieren

### Option 2: SQL
```bash
docker exec supabase-db psql -U postgres -c "
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  instance_id,
  aud,
  role
) VALUES (
  gen_random_uuid(),
  'admin@example.com',
  crypt('DeinPasswort123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated'
);"
```

## Beispieldaten laden (optional)

Falls du die Beispieldaten (Lager, Sponsoren, etc.) laden möchtest:

### Option 1: Supabase Studio
1. Öffne http://localhost:3001
2. Gehe zu "SQL Editor"
3. Kopiere den Inhalt von `volumes/db/migrations/seed_data.sql`
4. Führe das Script aus

### Option 2: Terminal
```bash
docker exec -i supabase-db psql -U postgres < volumes/db/migrations/seed_data.sql
```

## Datenbank zurücksetzen

Um die Datenbank komplett zurückzusetzen:

```bash
# Container stoppen
docker compose down

# Datenbank-Volume löschen
docker volume rm fitundfun_db-data

# Neu starten
docker compose up -d
```
