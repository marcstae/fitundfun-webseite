-- Fit & Fun Database Schema

-- Settings Tabelle (Singleton)
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_title TEXT,
    contact_email TEXT,
    hero_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lager Tabelle
CREATE TABLE IF NOT EXISTS public.lager (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jahr INTEGER NOT NULL,
    titel TEXT,
    datum_von DATE NOT NULL,
    datum_bis DATE NOT NULL,
    beschreibung TEXT,
    preis TEXT,
    immich_album_url TEXT,
    ist_aktuell BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lager Downloads Tabelle
CREATE TABLE IF NOT EXISTS public.lager_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lager_id UUID REFERENCES public.lager(id) ON DELETE CASCADE,
    titel TEXT NOT NULL,
    file_path TEXT NOT NULL,
    reihenfolge INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lagerhaus Tabelle
CREATE TABLE IF NOT EXISTS public.lagerhaus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titel TEXT,
    beschreibung TEXT,
    bilder JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsoren Tabelle
CREATE TABLE IF NOT EXISTS public.sponsoren (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    reihenfolge INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kontakt Nachrichten Tabelle
CREATE TABLE IF NOT EXISTS public.kontakt_nachrichten (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    nachricht TEXT NOT NULL,
    gelesen BOOLEAN DEFAULT FALSE,
    erstellt_am TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_lager_jahr ON public.lager(jahr);
CREATE INDEX IF NOT EXISTS idx_lager_aktuell ON public.lager(ist_aktuell);
CREATE INDEX IF NOT EXISTS idx_lager_downloads_lager_id ON public.lager_downloads(lager_id);
CREATE INDEX IF NOT EXISTS idx_kontakt_gelesen ON public.kontakt_nachrichten(gelesen);

-- Row Level Security aktivieren
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lager ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lager_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lagerhaus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsoren ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kontakt_nachrichten ENABLE ROW LEVEL SECURITY;

-- Policies: Öffentliches Lesen
CREATE POLICY "Öffentliches Lesen von Settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Öffentliches Lesen von Lager" ON public.lager FOR SELECT USING (true);
CREATE POLICY "Öffentliches Lesen von Lager Downloads" ON public.lager_downloads FOR SELECT USING (true);
CREATE POLICY "Öffentliches Lesen von Lagerhaus" ON public.lagerhaus FOR SELECT USING (true);
CREATE POLICY "Öffentliches Lesen von Sponsoren" ON public.sponsoren FOR SELECT USING (true);

-- Policies: Kontaktnachrichten können erstellt werden
CREATE POLICY "Kontakt erstellen" ON public.kontakt_nachrichten FOR INSERT WITH CHECK (true);

-- Policies: Authentifizierte Benutzer (Admin)
CREATE POLICY "Admin Settings verwalten" ON public.settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Lager verwalten" ON public.lager FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Downloads verwalten" ON public.lager_downloads FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Lagerhaus verwalten" ON public.lagerhaus FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Sponsoren verwalten" ON public.sponsoren FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Nachrichten verwalten" ON public.kontakt_nachrichten FOR ALL USING (auth.role() = 'authenticated');

-- Storage Buckets erstellen
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT DO NOTHING;

-- Storage Policies
CREATE POLICY "PDFs öffentlich lesbar" ON storage.objects FOR SELECT USING (bucket_id = 'pdfs');
CREATE POLICY "PDFs von Auth hochladen" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pdfs' AND auth.role() = 'authenticated');
CREATE POLICY "PDFs von Auth löschen" ON storage.objects FOR DELETE USING (bucket_id = 'pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Images öffentlich lesbar" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Images von Auth hochladen" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
CREATE POLICY "Images von Auth löschen" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

-- HINWEIS: Keine Daten werden hier eingefügt!
-- Die Datenbank startet leer. Daten können manuell über das Admin-Panel
-- oder via separatem Migrations-Script eingefügt werden.
-- Siehe: volumes/db/migrations/seed_data.sql (nicht automatisch ausgeführt)
