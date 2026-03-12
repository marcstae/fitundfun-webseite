import mongoose from 'mongoose'
import { Setting, Lager, Lagerhaus, Sponsor } from '../models/index.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitundfun'

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('MongoDB verbunden')

  // 1. Settings
  await Setting.findOneAndUpdate(
    {},
    { siteTitle: 'Fit & Fun Familien Lager', contactEmail: 'lager@fitundfun.ch' },
    { upsert: true }
  )
  console.log('Settings erstellt')

  // 2. Lagerhaus
  await Lagerhaus.findOneAndUpdate(
    {},
    {
      titel: 'Lagerhaus Crestneder',
      beschreibung: 'Das Lagerhaus Crestneder bietet den perfekten Rahmen für unser Fit & Fun Familienlager in Brigels. Mit atemberaubender Aussicht auf die Bündner Berge und direktem Zugang zur Skipiste ist es der ideale Ort für eine unvergessliche Schneesportwoche.',
      bilder: [],
    },
    { upsert: true }
  )
  console.log('Lagerhaus erstellt')

  // 3. Sponsoren
  const sponsoren = [
    { name: 'Gemeinde Klingnau', logoUrl: 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/i4124653430b7da95/version/1487510240/image.jpg', reihenfolge: 1 },
    { name: 'Raiffeisenbank Wasserschloss', logoUrl: 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/i431f1ae1e44b1160/version/1737538050/image.jpg', reihenfolge: 2 },
    { name: 'Aargauische Kantonalbank', logoUrl: 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/idf1b847156d7746c/version/1673284756/image.png', reihenfolge: 3 },
    { name: 'Gemeinde Gebenstorf', logoUrl: 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/ic7b578caf04e7197/version/1487510240/image.jpg', reihenfolge: 4 },
    { name: 'Blumenthal AG', logoUrl: 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/i981b0f572331659c/version/1737538027/image.jpg', reihenfolge: 5 },
    { name: 'Auto Kunz AG', logoUrl: 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/iffda4ee17a0cd8c3/version/1673285229/image.png', reihenfolge: 6 },
    { name: 'Schmid Bauunternehmen', logoUrl: 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/ic25c33e4db95a04e/version/1704705807/image.jpg', reihenfolge: 7 },
    { name: 'EW Klingnau', logoUrl: 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/i86cbc703fe7ed2c8/version/1768135415/image.jpg', reihenfolge: 8 },
    { name: 'Feldschlösschen', logoUrl: 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/i1c75e81e930728e6/version/1737537872/image.png', reihenfolge: 9 },
    { name: 'Gebr. Meier Söhne AG', logoUrl: 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/ib33ae289c67b0043/version/1737537997/image.jpg', reihenfolge: 10 },
    { name: 'Jumbo', logoUrl: 'https://image.jimcdn.com/app/cms/storage/image/path/s00831e5924d25c7f/image/ifbf11d228c1fda5f/version/1768135400/image.png', reihenfolge: 11 },
  ]

  for (const s of sponsoren) {
    await Sponsor.findOneAndUpdate({ name: s.name }, s, { upsert: true })
  }
  console.log(`${sponsoren.length} Sponsoren erstellt`)

  // 4. Lager 2026 (aktuell)
  await Lager.findOneAndUpdate(
    { jahr: 2026 },
    {
      jahr: 2026,
      titel: 'Fit & Fun 2026',
      datumVon: new Date('2026-01-31'),
      datumBis: new Date('2026-02-07'),
      beschreibung: 'Jugendlichen und Familien eine unvergessliche Schneesportwoche ermöglichen und gleichzeitig jungen Leitenden eine Entwicklungsplattform geben - das ist unser Ziel. Schön, mit euch diesen Weg zu verfolgen...!\n\nAktivitäten: skifahren, boarden, leiterlispiel, schneeschuhlaufen, jassen, iglubauen, fackelabfahrt, skirennen, dog, lachen, backgammon, karaoke, schlemmen, sonne, ...',
      istAktuell: true,
    },
    { upsert: true }
  )
  console.log('Lager 2026 erstellt')

  // 5. Archiv-Lager
  const archivLager = [
    { jahr: 2025, titel: 'Fit & Fun 2025', datumVon: '2025-02-01', datumBis: '2025-02-08' },
    { jahr: 2024, titel: 'Fit & Fun 2024', datumVon: '2024-02-03', datumBis: '2024-02-10' },
    { jahr: 2023, titel: 'Fit & Fun 2023', datumVon: '2023-01-28', datumBis: '2023-02-04' },
    { jahr: 2022, titel: 'Fit & Fun 2022', datumVon: '2022-01-29', datumBis: '2022-02-05' },
    { jahr: 2020, titel: 'Fit & Fun 2020', datumVon: '2020-02-01', datumBis: '2020-02-08' },
    { jahr: 2019, titel: 'Fit & Fun 2019', datumVon: '2019-02-02', datumBis: '2019-02-09' },
    { jahr: 2018, titel: 'Fit & Fun 2018', datumVon: '2018-02-03', datumBis: '2018-02-10' },
    { jahr: 2017, titel: 'Fit & Fun 2017', datumVon: '2017-01-28', datumBis: '2017-02-04' },
    { jahr: 2016, titel: 'Fit & Fun 2016', datumVon: '2016-01-30', datumBis: '2016-02-06' },
    { jahr: 2015, titel: 'Fit & Fun 2015', datumVon: '2015-01-31', datumBis: '2015-02-07' },
    { jahr: 2014, titel: 'Fit & Fun 2014', datumVon: '2014-02-01', datumBis: '2014-02-08' },
    { jahr: 2013, titel: 'Fit & Fun 2013', datumVon: '2013-02-02', datumBis: '2013-02-09' },
    { jahr: 2012, titel: 'Fit & Fun 2012', datumVon: '2012-01-28', datumBis: '2012-02-04' },
    { jahr: 2011, titel: 'Fit & Fun 2011', datumVon: '2011-01-29', datumBis: '2011-02-05' },
    { jahr: 2010, titel: 'Fit & Fun 2010', datumVon: '2010-01-30', datumBis: '2010-02-06' },
    { jahr: 2009, titel: 'Fit & Fun 2009', datumVon: '2009-01-31', datumBis: '2009-02-07' },
    { jahr: 2008, titel: 'Fit & Fun 2008', datumVon: '2008-02-02', datumBis: '2008-02-09' },
    { jahr: 2007, titel: 'Fit & Fun 2007', datumVon: '2007-02-03', datumBis: '2007-02-10' },
  ]

  for (const l of archivLager) {
    await Lager.findOneAndUpdate(
      { jahr: l.jahr },
      {
        ...l,
        datumVon: new Date(l.datumVon),
        datumBis: new Date(l.datumBis),
        istAktuell: false,
      },
      { upsert: true }
    )
  }
  console.log(`${archivLager.length} Archiv-Lager erstellt`)

  console.log('Seed-Daten erfolgreich eingefuegt!')
  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed Fehler:', err)
  process.exit(1)
})
