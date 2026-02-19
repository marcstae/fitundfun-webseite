import { serverSupabaseServiceRole } from '#supabase/server'
import { LagerSchema, validateBody } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  // Auth wird durch server/middleware/admin-guard.ts sichergestellt
  const body = await validateBody(event, LagerSchema)
  const client = await serverSupabaseServiceRole(event)

  try {
    if (body.ist_aktuell) {
      // Nur ein Lager darf aktuell sein
      await client.from('lager').update({ ist_aktuell: false })
    }

    const { data, error } = await client.from('lager').insert(body).select().single()

    if (error) {
      throw error
    }

    return { success: true, lager: data }
  } catch (error: any) {
    console.error('[admin/lager][create]', error)
    throw createError({ statusCode: 500, statusMessage: 'Speichern fehlgeschlagen' })
  }
})
