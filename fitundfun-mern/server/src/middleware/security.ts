import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  const isDev = env.NODE_ENV === 'development'

  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline'"

  const connectSrc = isDev
    ? "'self' http://localhost:* ws://localhost:*"
    : "'self'"

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: https:`,
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': csp,
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  })

  if (!isDev) {
    res.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  next()
}
