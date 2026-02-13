import { serverSupabaseClient } from '#supabase/server'
import { LoginSchema, validateBody } from '~/server/utils/validation'
import { rateLimitAuth } from '~/server/utils/rateLimit'

export default defineEventHandler(async (event) => {
  // Rate limiting: Max 5 login attempts per 15 minutes
  rateLimitAuth(event)
  
  // Validate input with Zod schema
  const body = await validateBody(event, LoginSchema)

  try {
    const client = await serverSupabaseClient(event)
    
    const { data, error } = await client.auth.signInWithPassword({
      email: body.email,
      password: body.password
    })

    if (error) {
      // Generic error message - don't reveal if email exists
      throw createError({
        statusCode: 401,
        statusMessage: 'Ungültige Anmeldedaten'
      })
    }

    // Die Cookies werden automatisch vom Supabase SSR Client gesetzt
    return {
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    }
  } catch (error: any) {
    // Wenn es bereits ein H3Error ist, weiterwerfen
    if (error.statusCode) {
      throw error
    }
    
    // Log full error server-side, return generic message to client
    console.error('[Auth] Login error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten'
    })
  }
})
