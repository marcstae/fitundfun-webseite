import { serverSupabaseServiceRole } from '#supabase/server'
import { LagerUpdateSchema, validateBody } from '~/server/utils/validation'

export default defineEventHandler(async (event) => {
  // Auth wird durch server/middleware/admin-guard.ts sichergestellt
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID fehlt' })
  }

  const body = await validateBody(event, LagerUpdateSchema)
  const client = await serverSupabaseServiceRole(event)

  try {
    if (body.ist_aktuell) {
      await client.from('lager').update({ ist_aktuell: false }).neq('id', id)
    }

    const { data, error } = await client.from('lager').update(body).eq('id', id).select().single()

    if (error) {
      throw error
    }

    return { success: true, lager: data }
  } catch (error: any) {
    console.error('[admin/lager][update]', error)
    throw createError({ statusCode: 500, statusMessage: 'Speichern fehlgeschlagen' })
  }
})
