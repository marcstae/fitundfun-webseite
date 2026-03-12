import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { AdminUser } from '../models/index.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitundfun'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fitundfun.ch'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

async function createAdmin() {
  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD Umgebungsvariable fehlt')
    process.exit(1)
  }

  await mongoose.connect(MONGODB_URI)
  console.log('MongoDB verbunden')

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  await AdminUser.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    { email: ADMIN_EMAIL, passwordHash },
    { upsert: true }
  )

  console.log(`Admin-Benutzer erstellt: ${ADMIN_EMAIL}`)
  await mongoose.disconnect()
  process.exit(0)
}

createAdmin().catch((err) => {
  console.error('Fehler:', err)
  process.exit(1)
})
