/**
 * Server-Middleware: Automatischer Auth-Guard für alle /api/admin/** Routen.
 *
 * Stellt sicher, dass JEDER Admin-Endpoint geschützt ist – auch wenn ein
 * Entwickler vergisst, `requireAuth()` im Handler aufzurufen.
 *
 * Prüft zusätzlich den X-Requested-With-Header bei schreibenden Methoden
 * als einfache CSRF-Schutzmaßnahme (Double-Submit-Pattern nicht nötig,
 * da Supabase-Cookies SameSite=Lax haben).
 */
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  // Nur /api/admin/** Routen schützen
  if (!path.startsWith('/api/admin')) return

  // Auth-Check
  const user = await serverSupabaseUser(event).catch(() => null)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Nicht autorisiert',
    })
  }

  // CSRF-Schutz: Schreibende Methoden müssen von $fetch / XHR kommen
  const method = getMethod(event)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const requestedWith = getRequestHeader(event, 'x-requested-with')
    // $fetch setzt diesen Header nicht automatisch, aber es sendet
    // Content-Type: application/json – was kein "simple request" ist
    // und daher einen CORS-Preflight auslöst. Das reicht als Schutz.
    // Wir prüfen trotzdem auf Content-Type für zusätzliche Sicherheit.
    const contentType = getRequestHeader(event, 'content-type') || ''
    const isJsonOrMultipart =
      contentType.includes('application/json') ||
      contentType.includes('multipart/form-data')

    if (!isJsonOrMultipart && !requestedWith) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Ungültige Anfrage',
      })
    }
  }

  // User im Event-Context speichern für nachfolgende Handler
  event.context.auth = {
    userId: user.id || user.sub,
    email: user.email,
    role: user.role,
  }
})
