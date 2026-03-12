import { Router } from 'express'
import { adminGuard } from '../../middleware/adminGuard.js'
import lagerRouter from './lager.js'
import downloadsRouter from './downloads.js'
import lagerhausRouter from './lagerhaus.js'
import sponsorenRouter from './sponsoren.js'
import nachrichtenRouter from './nachrichten.js'
import settingsRouter from './settings.js'
import backupRouter from './backup.js'

const router = Router()

// Alle Admin-Routen mit adminGuard schuetzen
router.use(adminGuard)

router.use('/lager', lagerRouter)
router.use('/downloads', downloadsRouter)
router.use('/lagerhaus', lagerhausRouter)
router.use('/sponsoren', sponsorenRouter)
router.use('/nachrichten', nachrichtenRouter)
router.use('/settings', settingsRouter)
router.use('/backup', backupRouter)

export default router
