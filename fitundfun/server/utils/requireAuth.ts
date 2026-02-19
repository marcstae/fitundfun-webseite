/**
 * Zentrale Auth-Prüfung für Server-API-Routes.
 *
 * Verwendet `serverSupabaseUser` (liest JWT aus dem Cookie).
 * Wirft 401, wenn kein gültiger User vorhanden ist.
 */
import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

export async function requireAuth(event: H3Event) {
  const user = await serverSupabaseUser(event).catch(() => null)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Nicht autorisiert',
    })
  }

  return user
}
