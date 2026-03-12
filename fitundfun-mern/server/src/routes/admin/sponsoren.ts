import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { Sponsor } from '../../models/index.js'
import { SponsorSchema } from '../../schemas/sponsor.schema.js'
import { validate } from '../../middleware/validate.js'
import { uploadImage } from '../../middleware/upload.js'
import { rateLimitUpload } from '../../middleware/rateLimit.js'

const router = Router()

// GET /api/admin/sponsoren
router.get('/', async (_req, res) => {
  try {
    const sponsoren = await Sponsor.find().sort({ reihenfolge: 1 })
    res.json(sponsoren)
  } catch (error) {
    console.error('[admin/sponsoren] list error:', error)
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' })
  }
})

// POST /api/admin/sponsoren
router.post('/', rateLimitUpload, uploadImage.single('logo'), async (req, res) => {
  try {
    const data: Record<string, unknown> = {
      name: req.body.name,
      websiteUrl: req.body.websiteUrl || null,
      reihenfolge: parseInt(req.body.reihenfolge) || 0,
    }

    if (req.file) {
      data.logoUrl = req.file.filename
    } else if (req.body.logoUrl) {
      data.logoUrl = req.body.logoUrl
    }

    const sponsor = await Sponsor.create(data)
    res.json({ success: true, sponsor })
  } catch (error) {
    console.error('[admin/sponsoren] create error:', error)
    res.status(500).json({ message: 'Speichern fehlgeschlagen' })
  }
})

// PUT /api/admin/sponsoren/:id
router.put('/:id', rateLimitUpload, uploadImage.single('logo'), async (req, res) => {
  try {
    const data: Record<string, unknown> = {
      name: req.body.name,
      websiteUrl: req.body.websiteUrl || null,
      reihenfolge: parseInt(req.body.reihenfolge) || 0,
    }

    if (req.file) {
      // Altes Logo loeschen
      const old = await Sponsor.findById(req.params.id)
      if (old?.logoUrl && !old.logoUrl.startsWith('http')) {
        const oldPath = path.resolve('uploads', 'images', old.logoUrl)
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      }
      data.logoUrl = req.file.filename
    } else if (req.body.logoUrl !== undefined) {
      data.logoUrl = req.body.logoUrl || null
    }

    const sponsor = await Sponsor.findByIdAndUpdate(req.params.id, data, { new: true })
    if (!sponsor) {
      res.status(404).json({ message: 'Sponsor nicht gefunden' })
      return
    }

    res.json({ success: true, sponsor })
  } catch (error) {
    console.error('[admin/sponsoren] update error:', error)
    res.status(500).json({ message: 'Speichern fehlgeschlagen' })
  }
})

// DELETE /api/admin/sponsoren/:id
router.delete('/:id', async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id)
    if (!sponsor) {
      res.status(404).json({ message: 'Sponsor nicht gefunden' })
      return
    }

    // Logo loeschen
    if (sponsor.logoUrl && !sponsor.logoUrl.startsWith('http')) {
      const filePath = path.resolve('uploads', 'images', sponsor.logoUrl)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }

    await Sponsor.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('[admin/sponsoren] delete error:', error)
    res.status(500).json({ message: 'Loeschen fehlgeschlagen' })
  }
})

export default router
