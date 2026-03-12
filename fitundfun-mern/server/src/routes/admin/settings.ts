import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { Setting } from '../../models/index.js'
import { SettingsSchema } from '../../schemas/settings.schema.js'
import { validate } from '../../middleware/validate.js'
import { uploadImage } from '../../middleware/upload.js'
import { rateLimitUpload } from '../../middleware/rateLimit.js'

const router = Router()

// GET /api/admin/settings
router.get('/', async (_req, res) => {
  try {
    const settings = await Setting.findOne()
    res.json(settings || { siteTitle: null, contactEmail: null, heroImageUrl: null })
  } catch (error) {
    console.error('[admin/settings] get error:', error)
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' })
  }
})

// PUT /api/admin/settings
router.put('/', rateLimitUpload, uploadImage.single('heroImage'), async (req, res) => {
  try {
    const data: Record<string, unknown> = {}

    if (req.body.siteTitle !== undefined) data.siteTitle = req.body.siteTitle
    if (req.body.contactEmail !== undefined) data.contactEmail = req.body.contactEmail

    if (req.file) {
      // Altes Hero-Bild loeschen
      const old = await Setting.findOne()
      if (old?.heroImageUrl && !old.heroImageUrl.startsWith('http')) {
        const oldPath = path.resolve('uploads', 'images', old.heroImageUrl)
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      }
      data.heroImageUrl = req.file.filename
    } else if (req.body.heroImageUrl !== undefined) {
      data.heroImageUrl = req.body.heroImageUrl
    }

    const settings = await Setting.findOneAndUpdate(
      {},
      data,
      { new: true, upsert: true }
    )

    res.json({ success: true, settings })
  } catch (error) {
    console.error('[admin/settings] update error:', error)
    res.status(500).json({ message: 'Speichern fehlgeschlagen' })
  }
})

export default router
