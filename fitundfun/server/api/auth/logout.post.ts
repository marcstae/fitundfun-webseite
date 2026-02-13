import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient(event)
    
    await client.auth.signOut()

    return {
      success: true
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Logout fehlgeschlagen'
    })
  }
})
