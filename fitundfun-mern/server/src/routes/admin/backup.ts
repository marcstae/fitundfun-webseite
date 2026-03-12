import { Router } from 'express'
import archiver from 'archiver'
import JSZip from 'jszip'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import { Setting, Lager, LagerDownload, Lagerhaus, Sponsor, KontaktNachricht } from '../../models/index.js'
import { getMimeType } from '../../utils/fileValidation.js'

const router = Router()
const uploadZip = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } })

// GET /api/admin/backup
router.get('/', async (req, res) => {
  try {
    const manifest = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      createdBy: req.auth?.email || 'unknown',
      collections: [] as string[],
      storageDirs: [] as string[],
    }

    // Datenbank-Daten exportieren
    const collections = {
      settings: await Setting.find().lean(),
      lager: await Lager.find().lean(),
      lagerDownloads: await LagerDownload.find().lean(),
      lagerhaus: await Lagerhaus.find().lean(),
      sponsoren: await Sponsor.find().lean(),
      kontaktNachrichten: await KontaktNachricht.find().lean(),
    }

    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []
    archive.on('data', (chunk) => chunks.push(chunk))

    // Manifest
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' })

    // Daten
    for (const [name, data] of Object.entries(collections)) {
      if (data.length > 0) manifest.collections.push(name)
      archive.append(JSON.stringify(data, null, 2), { name: `data/${name}.json` })
    }

    // Storage-Dateien
    const uploadDir = path.resolve('uploads')
    for (const dir of ['images', 'pdfs']) {
      const dirPath = path.join(uploadDir, dir)
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath)
        if (files.length > 0) {
          manifest.storageDirs.push(dir)
          for (const file of files) {
            const filePath = path.join(dirPath, file)
            if (fs.statSync(filePath).isFile()) {
              archive.file(filePath, { name: `storage/${dir}/${file}` })
            }
          }
        }
      }
    }

    await archive.finalize()
    await new Promise<void>((resolve) => archive.on('end', resolve))

    const zipBuffer = Buffer.concat(chunks)
    const filename = `fitundfun-backup-${new Date().toISOString().split('T')[0]}.zip`

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(zipBuffer.length),
    })

    res.send(zipBuffer)
  } catch (error) {
    console.error('[Backup] Error:', error)
    res.status(500).json({ message: 'Fehler beim Erstellen des Backups' })
  }
})

// POST /api/admin/backup/restore
router.post('/restore', uploadZip.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Keine Datei hochgeladen' })
      return
    }

    let options = { restoreData: true, restoreStorage: true, clearExisting: false }
    if (req.body.options) {
      try { options = { ...options, ...JSON.parse(req.body.options) } } catch {}
    }

    const zip = await JSZip.loadAsync(req.file.buffer)

    const manifestFile = zip.file('manifest.json')
    if (!manifestFile) {
      res.status(400).json({ message: 'Ungueltige Backup-Datei: manifest.json fehlt' })
      return
    }

    const manifest = JSON.parse(await manifestFile.async('string'))
    const results = {
      manifest,
      restoredCollections: [] as string[],
      restoredFiles: [] as string[],
      errors: [] as string[],
    }

    // Daten wiederherstellen
    if (options.restoreData) {
      const modelMap: Record<string, any> = {
        settings: Setting,
        lager: Lager,
        lagerDownloads: LagerDownload,
        lagerhaus: Lagerhaus,
        sponsoren: Sponsor,
        kontaktNachrichten: KontaktNachricht,
      }

      const order = ['settings', 'lagerhaus', 'sponsoren', 'lager', 'lagerDownloads', 'kontaktNachrichten']

      for (const collName of order) {
        const dataFile = zip.file(`data/${collName}.json`)
        if (!dataFile) continue

        try {
          const data = JSON.parse(await dataFile.async('string'))
          if (!Array.isArray(data) || data.length === 0) continue

          const Model = modelMap[collName]
          if (!Model) continue

          if (options.clearExisting) {
            await Model.deleteMany({})
          }

          await Model.insertMany(data, { ordered: false }).catch(() => {
            // Duplicates ignorieren
          })

          results.restoredCollections.push(collName)
        } catch (e: any) {
          results.errors.push(`Fehler bei ${collName}: ${e.message}`)
        }
      }
    }

    // Storage-Dateien wiederherstellen
    if (options.restoreStorage) {
      const uploadDir = path.resolve('uploads')

      for (const dir of ['images', 'pdfs']) {
        if (options.clearExisting) {
          const dirPath = path.join(uploadDir, dir)
          if (fs.existsSync(dirPath)) {
            for (const file of fs.readdirSync(dirPath)) {
              fs.unlinkSync(path.join(dirPath, file))
            }
          }
        }

        const prefix = `storage/${dir}/`
        const files = Object.keys(zip.files).filter(
          (p) => p.startsWith(prefix) && !p.endsWith('/')
        )

        for (const filePath of files) {
          const file = zip.file(filePath)
          if (!file) continue

          try {
            const data = await file.async('nodebuffer')
            const storagePath = filePath.replace(prefix, '')
            const destDir = path.join(uploadDir, dir)
            fs.mkdirSync(destDir, { recursive: true })
            fs.writeFileSync(path.join(destDir, storagePath), data)
            results.restoredFiles.push(`${dir}/${storagePath}`)
          } catch (e: any) {
            results.errors.push(`Fehler bei Datei ${filePath}: ${e.message}`)
          }
        }
      }
    }

    res.json({ success: true, message: 'Backup wiederhergestellt', results })
  } catch (error: any) {
    console.error('[Restore] Error:', error)
    res.status(500).json({ message: 'Fehler beim Wiederherstellen des Backups' })
  }
})

export default router
