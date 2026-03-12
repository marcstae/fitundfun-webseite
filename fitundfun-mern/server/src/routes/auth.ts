import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AdminUser } from '../models/index.js'
import { LoginSchema } from '../schemas/auth.schema.js'
import { validate } from '../middleware/validate.js'
import { rateLimitAuth } from '../middleware/rateLimit.js'

const router = Router()

// POST /api/auth/login
router.post('/login', rateLimitAuth, validate(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await AdminUser.findOne({ email })
    if (!user) {
      res.status(401).json({ message: 'Ungueltige Anmeldedaten' })
      return
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      res.status(401).json({ message: 'Ungueltige Anmeldedaten' })
      return
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    })

    res.json({ success: true, user: { id: user._id, email: user.email } })
  } catch (error) {
    console.error('[Auth] Login error:', error)
    res.status(500).json({ message: 'Ein Fehler ist aufgetreten' })
  }
})

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
  res.json({ success: true })
})

// GET /api/auth/me
router.get('/me', (req, res) => {
  const token = req.cookies?.token
  if (!token) {
    res.json({ authenticated: false, user: null })
    return
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string }
    res.json({
      authenticated: true,
      user: { id: payload.userId, email: payload.email },
    })
  } catch {
    res.json({ authenticated: false, user: null })
  }
})

export default router
