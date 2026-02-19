/**
 * Security Headers Middleware
 *
 * - CSP dynamisch aus RuntimeConfig (Supabase-URL, Site-URL)
 * - Dev: unsafe-inline/eval erlaubt (HMR), Prod: nur unsafe-inline (Nuxt SSR hydration)
 * - Nur auf navigierbare Routen (kein /_nuxt/, kein /api/)
 */
export default defineEventHandler((event) => {
  const path = event.path || ''

  // Statische Assets und API-Routen brauchen keine CSP
  if (path.startsWith('/_nuxt/') || path.startsWith('/api/') || path.startsWith('/__nuxt')) {
    // Nur Basis-Headers für alle Responses
    setResponseHeaders(event, {
      'X-Content-Type-Options': 'nosniff',
    })
    return
  }

  const isDev = process.dev

  // Supabase-URL aus RuntimeConfig für connect-src / img-src
  const config = useRuntimeConfig()
  const supabaseUrl = (config.public?.supabase?.clientUrl as string) || ''
  const siteUrl = (config.public?.supabase?.url as string) || ''

  // Erlaubte Origins sammeln (dedupliziert)
  const extraOrigins = new Set<string>()
  for (const raw of [supabaseUrl, siteUrl]) {
    if (raw) {
      try { extraOrigins.add(new URL(raw).origin) } catch {}
    }
  }
  const origins = [...extraOrigins].join(' ')

  // --- CSP aufbauen ---
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"  // HMR + Vite benötigen eval in Dev
    : "'self' 'unsafe-inline'"                 // Nuxt SSR hydration braucht inline

  const connectSrc = isDev
    ? `'self' ${origins} http://localhost:* ws://localhost:*`
    : `'self' ${origins}`

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: ${origins} https:`,
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': csp,
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }

  // HSTS nur in Prod (wenn hinter TLS-Proxy)
  if (!isDev) {
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload'
  }

  setResponseHeaders(event, headers)
})
