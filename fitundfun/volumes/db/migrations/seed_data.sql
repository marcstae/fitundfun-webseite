-- Seed Data Script: Beispieldaten für Fit & Fun
-- 
-- HINWEIS: Dieses Script wird NICHT automatisch ausgeführt!
-- Um die Daten zu laden, führe aus:
--   docker exec supabase-db psql -U postgres -f /docker-entrypoint-initdb.d/migrations/seed_data.sql
-- 
-- Oder kopiere den Inhalt in Supabase Studio SQL Editor (http://localhost:3001)

-- ============================================
-- 1. SETTINGS (muss zuerst erstellt werden)
-- ============================================
INSERT INTO public.settings (site_title, contact_email)
VALUES ('Fit & Fun Familien Lager', 'lager@fitundfun.ch')
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. LAGERHAUS DATEN
-- ============================================
INSERT INTO public.lagerhaus (titel, beschreibung, bilder)
VALUES (
  'Lagerhaus Crestneder',
  'Das Lagerhaus Crestneder bietet den perfekten Rahmen für unser Fit & Fun Familienlager in Brigels. Mit atemberaubender Aussicht auf die Bündner Berge und direktem Zugang zur Skipiste ist es der ideale Ort für eine unvergessliche Schneesportwoche.',
  '[]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. SPONSOREN DATEN
-- ============================================
-- Gemeinde Klingnau
INSERT INTO sponsoren (name, website_url, logo_url, reihenfolge)
VALUES ('Gemeinde Klingnau', NULL, 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/i4124653430b7da95/version/1487510240/image.jpg', 1)
ON CONFLICT DO NOTHING;

-- Raiffeisenbank Wasserschloss
INSERT INTO sponsoren (name, website_url, logo_url, reihenfolge)
VALUES ('Raiffeisenbank Wasserschloss', NULL, 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/i431f1ae1e44b1160/version/1737538050/image.jpg', 2)
ON CONFLICT DO NOTHING;

-- Aargauische Kantonalbank
INSERT INTO sponsoren (name, website_url, logo_url, reihenfolge)
VALUES ('Aargauische Kantonalbank', NULL, 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/idf1b847156d7746c/version/1673284756/image.png', 3)
ON CONFLICT DO NOTHING;

-- Gemeinde Gebenstorf
INSERT INTO sponsoren (name, website_url, logo_url, reihenfolge)
VALUES ('Gemeinde Gebenstorf', NULL, 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/ic7b578caf04e7197/version/1487510240/image.jpg', 4)
ON CONFLICT DO NOTHING;

-- Blumenthal AG
INSERT INTO sponsoren (name, website_url, logo_url, reihenfolge)
VALUES ('Blumenthal AG', NULL, 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/i981b0f572331659c/version/1737538027/image.jpg', 5)
ON CONFLICT DO NOTHING;

-- Auto Kunz AG
INSERT INTO sponsoren (name, website_url, logo_url, reihenfolge)
VALUES ('Auto Kunz AG', NULL, 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/iffda4ee17a0cd8c3/version/1673285229/image.png', 6)
ON CONFLICT DO NOTHING;

-- Schmid Bauunternehmen
INSERT INTO sponsoren (name, website_url, logo_url, reihenfolge)
VALUES ('Schmid Bauunternehmen', NULL, 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/ic25c33e4db95a04e/version/1704705807/image.jpg', 7)
ON CONFLICT DO NOTHING;

-- EW Klingnau
INSERT INTO sponsoren (name, website_url, logo_url, reihenfolge)
VALUES ('EW Klingnau', NULL, 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/i86cbc703fe7ed2c8/version/1768135415/image.jpg', 8)
ON CONFLICT DO NOTHING;

-- Feldschlösschen
INSERT INTO sponsoren (name, website_url, logo_url, reihenfolge)
VALUES ('Feldschlösschen', NULL, 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/i1c75e81e930728e6/version/1737537872/image.png', 9)
ON CONFLICT DO NOTHING;

-- Gebr. Meier Söhne AG
INSERT INTO sponsoren (name, website_url, logo_url, reihenfolge)
VALUES ('Gebr. Meier Söhne AG', NULL, 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/ib33ae289c67b0043/version/1737537997/image.jpg', 10)
ON CONFLICT DO NOTHING;

-- Jumbo
INSERT INTO sponsoren (name, website_url, logo_url, reihenfolge)
VALUES ('Jumbo', NULL, 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/ifbf11d228c1fda5f/version/1768135400/image.png', 11)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. LAGER 2026 (aktuelles Lager)
-- ============================================
INSERT INTO public.lager (jahr, titel, datum_von, datum_bis, beschreibung, ist_aktuell)
VALUES (
  2026,
  'Fit & Fun 2026',
  '2026-01-31',
  '2026-02-07',
  'Jugendlichen und Familien eine unvergessliche Schneesportwoche ermöglichen und gleichzeitig jungen Leitenden eine Entwicklungsplattform geben - das ist unser Ziel. Schön, mit euch diesen Weg zu verfolgen...!

Aktivitäten: skifahren, boarden, leiterlispiel, schneeschuhlaufen, jassen, iglubauen, fackelabfahrt, skirennen, dog, lachen, backgammon, karaoke, schlemmen, sonne, ...',
  true
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. BISHERIGE LAGER (Archiv)
-- ============================================
INSERT INTO public.lager (jahr, titel, datum_von, datum_bis, ist_aktuell) VALUES
(2025, 'Fit & Fun 2025', '2025-02-01', '2025-02-08', false),
(2024, 'Fit & Fun 2024', '2024-02-03', '2024-02-10', false),
(2023, 'Fit & Fun 2023', '2023-01-28', '2023-02-04', false),
(2022, 'Fit & Fun 2022', '2022-01-29', '2022-02-05', false),
(2020, 'Fit & Fun 2020', '2020-02-01', '2020-02-08', false),
(2019, 'Fit & Fun 2019', '2019-02-02', '2019-02-09', false),
(2018, 'Fit & Fun 2018', '2018-02-03', '2018-02-10', false),
(2017, 'Fit & Fun 2017', '2017-01-28', '2017-02-04', false),
(2016, 'Fit & Fun 2016', '2016-01-30', '2016-02-06', false),
(2015, 'Fit & Fun 2015', '2015-01-31', '2015-02-07', false),
(2014, 'Fit & Fun 2014', '2014-02-01', '2014-02-08', false),
(2013, 'Fit & Fun 2013', '2013-02-02', '2013-02-09', false),
(2012, 'Fit & Fun 2012', '2012-01-28', '2012-02-04', false),
(2011, 'Fit & Fun 2011', '2011-01-29', '2011-02-05', false),
(2010, 'Fit & Fun 2010', '2010-01-30', '2010-02-06', false),
(2009, 'Fit & Fun 2009', '2009-01-31', '2009-02-07', false),
(2008, 'Fit & Fun 2008', '2008-02-02', '2008-02-09', false),
(2007, 'Fit & Fun 2007', '2007-02-03', '2007-02-10', false)
ON CONFLICT DO NOTHING;

-- ============================================
-- Fertig!
-- ============================================
SELECT 'Seed-Daten erfolgreich eingefügt!' as status;
SELECT 'Migration erfolgreich!' as status;
