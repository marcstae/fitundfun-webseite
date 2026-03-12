import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { Lagerhaus } from '../../models/index.js'
import { LagerhausSchema } from '../../schemas/lagerhaus.schema.js'
import { validate } from '../../middleware/validate.js'
import { uploadImage } from '../../middleware/upload.js'
import { rateLimitUpload } from '../../middleware/rateLimit.js'

const router = Router()

// GET /api/admin/lagerhaus
router.get('/', async (_req, res) => {
  try {
    const lagerhaus = await Lagerhaus.findOne()
    res.json(lagerhaus)
  } catch (error) {
    console.error('[admin/lagerhaus] get error:', error)
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' })
  }
})

// PUT /api/admin/lagerhaus
router.put('/', validate(LagerhausSchema), async (req, res) => {
  try {
    const lagerhaus = await Lagerhaus.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true }
    )
    res.json({ success: true, lagerhaus })
  } catch (error) {
    console.error('[admin/lagerhaus] update error:', error)
    res.status(500).json({ message: 'Speichern fehlgeschlagen' })
  }
})

// POST /api/admin/lagerhaus/images
router.post('/images', rateLimitUpload, uploadImage.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Keine Datei hochgeladen' })
      return
    }

    const lagerhaus = await Lagerhaus.findOneAndUpdate(
      {},
      { $push: { bilder: req.file.filename } },
      { new: true, upsert: true }
    )

    res.json({ success: true, lagerhaus })
  } catch (error) {
    console.error('[admin/lagerhaus] image upload error:', error)
    res.status(500).json({ message: 'Upload fehlgeschlagen' })
  }
})

// DELETE /api/admin/lagerhaus/images/:index
router.delete('/images/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index)
    const lagerhaus = await Lagerhaus.findOne()

    if (!lagerhaus || index < 0 || index >= lagerhaus.bilder.length) {
      res.status(404).json({ message: 'Bild nicht gefunden' })
      return
    }

    const filename = lagerhaus.bilder[index]

    // Datei loeschen
    const filePath = path.resolve('uploads', 'images', filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    lagerhaus.bilder.splice(index, 1)
    await lagerhaus.save()

    res.json({ success: true, lagerhaus })
  } catch (error) {
    console.error('[admin/lagerhaus] image delete error:', error)
    res.status(500).json({ message: 'Loeschen fehlgeschlagen' })
  }
})

export default router
