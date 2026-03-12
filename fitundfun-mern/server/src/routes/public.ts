import { Router } from 'express'
import { Setting, Lager, Lagerhaus, Sponsor, KontaktNachricht } from '../models/index.js'
import { ContactMessageSchema } from '../schemas/contact.schema.js'
import { validate } from '../middleware/validate.js'
import { rateLimitContact } from '../middleware/rateLimit.js'

const router = Router()

// GET /api/public/settings
router.get('/settings', async (_req, res) => {
  try {
    const settings = await Setting.findOne()
    res.json(settings || { siteTitle: null, contactEmail: null, heroImageUrl: null })
  } catch (error) {
    console.error('[Public] Settings error:', error)
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' })
  }
})

// GET /api/public/lager/aktuell
router.get('/lager/aktuell', async (_req, res) => {
  try {
    const lager = await Lager.findOne({ istAktuell: true }).populate('downloads')
    res.json(lager)
  } catch (error) {
    console.error('[Public] Lager aktuell error:', error)
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' })
  }
})

// GET /api/public/lager/archiv
router.get('/lager/archiv', async (_req, res) => {
  try {
    const lagerList = await Lager.find({ istAktuell: false }).sort({ jahr: -1 })
    res.json(lagerList)
  } catch (error) {
    console.error('[Public] Archiv error:', error)
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' })
  }
})

// GET /api/public/lager/:jahr
router.get('/lager/:jahr', async (req, res) => {
  try {
    const jahr = parseInt(req.params.jahr)
    if (isNaN(jahr)) {
      res.status(400).json({ message: 'Ungueltiges Jahr' })
      return
    }
    const lager = await Lager.findOne({ jahr }).populate('downloads')
    if (!lager) {
      res.status(404).json({ message: 'Lager nicht gefunden' })
      return
    }
    res.json(lager)
  } catch (error) {
    console.error('[Public] Lager by year error:', error)
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' })
  }
})

// GET /api/public/lagerhaus
router.get('/lagerhaus', async (_req, res) => {
  try {
    const lagerhaus = await Lagerhaus.findOne()
    res.json(lagerhaus)
  } catch (error) {
    console.error('[Public] Lagerhaus error:', error)
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' })
  }
})

// GET /api/public/sponsoren
router.get('/sponsoren', async (_req, res) => {
  try {
    const sponsoren = await Sponsor.find().sort({ reihenfolge: 1 })
    res.json(sponsoren)
  } catch (error) {
    console.error('[Public] Sponsoren error:', error)
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' })
  }
})

// POST /api/contact
router.post('/contact', rateLimitContact, validate(ContactMessageSchema), async (req, res) => {
  try {
    await KontaktNachricht.create({
      name: req.body.name,
      email: req.body.email,
      nachricht: req.body.nachricht,
    })
    res.json({ success: true, message: 'Nachricht erfolgreich gesendet' })
  } catch (error) {
    console.error('[Contact] Error:', error)
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' })
  }
})

export default router
