import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { LagerDownload } from '../../models/index.js'
import { uploadPdf } from '../../middleware/upload.js'
import { rateLimitUpload } from '../../middleware/rateLimit.js'

const router = Router()

// GET /api/admin/downloads/:lagerId
router.get('/:lagerId', async (req, res) => {
  try {
    const downloads = await LagerDownload.find({ lagerId: req.params.lagerId })
      .sort({ reihenfolge: 1 })
    res.json(downloads)
  } catch (error) {
    console.error('[admin/downloads] list error:', error)
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' })
  }
})

// POST /api/admin/downloads/:lagerId
router.post('/:lagerId', rateLimitUpload, uploadPdf.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Keine Datei hochgeladen' })
      return
    }

    const titel = req.body.titel || req.file.originalname.replace(/\.pdf$/i, '')
    const reihenfolge = parseInt(req.body.reihenfolge) || 0

    const download = await LagerDownload.create({
      lagerId: req.params.lagerId,
      titel,
      filePath: req.file.filename,
      reihenfolge,
    })

    res.json({ success: true, download })
  } catch (error) {
    console.error('[admin/downloads] create error:', error)
    res.status(500).json({ message: 'Upload fehlgeschlagen' })
  }
})

// DELETE /api/admin/downloads/:id
router.delete('/:id', async (req, res) => {
  try {
    const download = await LagerDownload.findById(req.params.id)
    if (!download) {
      res.status(404).json({ message: 'Download nicht gefunden' })
      return
    }

    // Datei loeschen
    const filePath = path.resolve('uploads', 'pdfs', download.filePath)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    await LagerDownload.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('[admin/downloads] delete error:', error)
    res.status(500).json({ message: 'Loeschen fehlgeschlagen' })
  }
})

export default router
