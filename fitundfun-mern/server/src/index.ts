import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { connectDB } from './config/db.js'
import { env } from './config/env.js'
import { securityHeaders } from './middleware/security.js'
import authRoutes from './routes/auth.js'
import publicRoutes from './routes/public.js'
import adminRoutes from './routes/admin/index.js'

const app = express()

// Globale Middleware
app.use(securityHeaders)
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))

// Statische Dateien
app.use('/uploads', express.static(path.resolve('uploads')))

// Routen
app.use('/api/auth', authRoutes)
app.use('/api/public', publicRoutes)
app.use('/api', publicRoutes) // /api/contact direkt erreichbar
app.use('/api/admin', adminRoutes)

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// In Produktion: Statische Client-Dateien servieren
if (env.NODE_ENV === 'production') {
  const clientPath = path.resolve('../client/dist')
  app.use(express.static(clientPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'))
  })
}

// Starten
async function start() {
  await connectDB()

  app.listen(parseInt(env.PORT), () => {
    console.log(`Server laeuft auf Port ${env.PORT} (${env.NODE_ENV})`)
  })
}

start().catch((err) => {
  console.error('Server Start-Fehler:', err)
  process.exit(1)
})
