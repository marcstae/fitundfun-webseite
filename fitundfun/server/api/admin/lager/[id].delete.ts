import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Auth wird durch server/middleware/admin-guard.ts sichergestellt
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID fehlt' })
  }

  const client = await serverSupabaseServiceRole(event)

  try {
    await client.from('lager_downloads').delete().eq('lager_id', id)
    const { error } = await client.from('lager').delete().eq('id', id)
    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('[admin/lager][delete]', error)
    throw createError({ statusCode: 500, statusMessage: 'Löschen fehlgeschlagen' })
  }
})
