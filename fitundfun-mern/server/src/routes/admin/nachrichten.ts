import { Router } from 'express'
import { KontaktNachricht } from '../../models/index.js'

const router = Router()

// GET /api/admin/nachrichten
router.get('/', async (_req, res) => {
  try {
    const nachrichten = await KontaktNachricht.find().sort({ erstelltAm: -1 })
    res.json(nachrichten)
  } catch (error) {
    console.error('[admin/nachrichten] list error:', error)
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' })
  }
})

// PATCH /api/admin/nachrichten/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const nachricht = await KontaktNachricht.findByIdAndUpdate(
      req.params.id,
      { gelesen: true },
      { new: true }
    )
    if (!nachricht) {
      res.status(404).json({ message: 'Nachricht nicht gefunden' })
      return
    }
    res.json({ success: true, nachricht })
  } catch (error) {
    console.error('[admin/nachrichten] mark read error:', error)
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' })
  }
})

// DELETE /api/admin/nachrichten/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await KontaktNachricht.findByIdAndDelete(req.params.id)
    if (!result) {
      res.status(404).json({ message: 'Nachricht nicht gefunden' })
      return
    }
    res.json({ success: true })
  } catch (error) {
    console.error('[admin/nachrichten] delete error:', error)
    res.status(500).json({ message: 'Loeschen fehlgeschlagen' })
  }
})

export default router
