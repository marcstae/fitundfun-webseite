/**
 * Rate Limiting Utility for Nuxt Server API Routes
 * 
 * Security: Prevents abuse of API endpoints through request throttling
 */
import { H3Event, createError, getRequestIP } from 'h3'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  message?: string
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// Note: In production with multiple instances, use Redis
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

/**
 * Default rate limit configurations
 */
export const RateLimits = {
  // Standard API endpoints
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Zu viele Anfragen. Bitte versuche es später erneut.'
  },
  
  // Login attempts (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Zu viele Anmeldeversuche. Bitte warte 15 Minuten.'
  },
  
  // Contact form submissions
  contact: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: 'Zu viele Nachrichten. Bitte warte eine Stunde.'
  },
  
  // File uploads
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Zu viele Uploads. Bitte warte eine Stunde.'
  }
} as const

/**
 * Get a unique identifier for the request
 */
function getIdentifier(event: H3Event, prefix: string): string {
  // Try to get the real IP address
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  return `${prefix}:${ip}`
}

/**
 * Check rate limit for a request
 * Throws 429 error if limit exceeded
 */
export function checkRateLimit(
  event: H3Event,
  config: RateLimitConfig,
  prefix: string = 'default'
): void {
  const identifier = getIdentifier(event, prefix)
  const now = Date.now()
  
  let entry = rateLimitStore.get(identifier)
  
  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs
    }
  }
  
  entry.count++
  rateLimitStore.set(identifier, entry)
  
  // Set rate limit headers
  const remaining = Math.max(0, config.maxRequests - entry.count)
  setResponseHeaders(event, {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000))
  })
  
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    setResponseHeader(event, 'Retry-After', String(retryAfter))
    
    throw createError({
      statusCode: 429,
      statusMessage: config.message || 'Too Many Requests'
    })
  }
}

/**
 * Rate limit middleware for auth endpoints
 */
export function rateLimitAuth(event: H3Event): void {
  checkRateLimit(event, RateLimits.auth, 'auth')
}

/**
 * Rate limit middleware for contact form
 */
export function rateLimitContact(event: H3Event): void {
  checkRateLimit(event, RateLimits.contact, 'contact')
}

/**
 * Rate limit middleware for standard endpoints
 */
export function rateLimitStandard(event: H3Event): void {
  checkRateLimit(event, RateLimits.standard, 'standard')
}

/**
 * Rate limit middleware for file uploads
 */
export function rateLimitUpload(event: H3Event): void {
  checkRateLimit(event, RateLimits.upload, 'upload')
}
