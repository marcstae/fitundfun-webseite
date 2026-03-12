import { Router } from 'express'
import { Lager, LagerDownload } from '../../models/index.js'
import { LagerSchema, LagerUpdateSchema } from '../../schemas/lager.schema.js'
import { validate } from '../../middleware/validate.js'

const router = Router()

// GET /api/admin/lager
router.get('/', async (_req, res) => {
  try {
    const lagerList = await Lager.find().sort({ jahr: -1 }).populate('downloads')
    res.json(lagerList)
  } catch (error) {
    console.error('[admin/lager] list error:', error)
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' })
  }
})

// POST /api/admin/lager
router.post('/', validate(LagerSchema), async (req, res) => {
  try {
    if (req.body.istAktuell) {
      await Lager.updateMany({}, { istAktuell: false })
    }

    const lager = await Lager.create({
      ...req.body,
      datumVon: new Date(req.body.datumVon),
      datumBis: new Date(req.body.datumBis),
    })

    res.json({ success: true, lager })
  } catch (error) {
    console.error('[admin/lager] create error:', error)
    res.status(500).json({ message: 'Speichern fehlgeschlagen' })
  }
})

// PUT /api/admin/lager/:id
router.put('/:id', validate(LagerUpdateSchema), async (req, res) => {
  try {
    const { id } = req.params

    if (req.body.istAktuell) {
      await Lager.updateMany({ _id: { $ne: id } }, { istAktuell: false })
    }

    const updateData = { ...req.body }
    if (updateData.datumVon) updateData.datumVon = new Date(updateData.datumVon)
    if (updateData.datumBis) updateData.datumBis = new Date(updateData.datumBis)

    const lager = await Lager.findByIdAndUpdate(id, updateData, { new: true })
    if (!lager) {
      res.status(404).json({ message: 'Lager nicht gefunden' })
      return
    }

    res.json({ success: true, lager })
  } catch (error) {
    console.error('[admin/lager] update error:', error)
    res.status(500).json({ message: 'Speichern fehlgeschlagen' })
  }
})

// DELETE /api/admin/lager/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Cascade: Downloads loeschen
    await LagerDownload.deleteMany({ lagerId: id })

    const result = await Lager.findByIdAndDelete(id)
    if (!result) {
      res.status(404).json({ message: 'Lager nicht gefunden' })
      return
    }

    res.json({ success: true })
  } catch (error) {
    console.error('[admin/lager] delete error:', error)
    res.status(500).json({ message: 'Loeschen fehlgeschlagen' })
  }
})

export default router
