import type { Request, Response, NextFunction } from 'express'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup alte Eintraege alle 60 Sekunden
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000)

export const RateLimits = {
  standard: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    message: 'Zu viele Anfragen. Bitte versuche es später erneut.',
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Zu viele Anmeldeversuche. Bitte warte 15 Minuten.',
  },
  contact: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
    message: 'Zu viele Nachrichten. Bitte warte eine Stunde.',
  },
  upload: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
    message: 'Zu viele Uploads. Bitte warte eine Stunde.',
  },
} as const

function getIdentifier(req: Request, prefix: string): string {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0] || 'unknown'
  return `${prefix}:${ip}`
}

function checkRateLimit(req: Request, res: Response, config: RateLimitConfig, prefix: string): boolean {
  const identifier = getIdentifier(req, prefix)
  const now = Date.now()

  let entry = rateLimitStore.get(identifier)

  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime: now + config.windowMs }
  }

  entry.count++
  rateLimitStore.set(identifier, entry)

  const remaining = Math.max(0, config.maxRequests - entry.count)
  res.set({
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000)),
  })

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    res.set('Retry-After', String(retryAfter))
    return false
  }

  return true
}

export function rateLimit(config: RateLimitConfig, prefix: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!checkRateLimit(req, res, config, prefix)) {
      res.status(429).json({ message: config.message || 'Too Many Requests' })
      return
    }
    next()
  }
}

export const rateLimitAuth = rateLimit(RateLimits.auth, 'auth')
export const rateLimitContact = rateLimit(RateLimits.contact, 'contact')
export const rateLimitUpload = rateLimit(RateLimits.upload, 'upload')
export const rateLimitStandard = rateLimit(RateLimits.standard, 'standard')
