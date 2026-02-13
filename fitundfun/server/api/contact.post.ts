import { serverSupabaseClient } from '#supabase/server'
import { ContactMessageSchema, validateBody } from '~/server/utils/validation'
import { rateLimitContact } from '~/server/utils/rateLimit'

export default defineEventHandler(async (event) => {
  // Rate limiting: Max 5 messages per hour
  rateLimitContact(event)
  
  // Validate input with Zod schema
  const body = await validateBody(event, ContactMessageSchema)
  
  try {
    const client = await serverSupabaseClient(event)
    
    const { error } = await client
      .from('kontakt_nachrichten')
      .insert({
        name: body.name,
        email: body.email,
        nachricht: body.nachricht
      })
    
    if (error) {
      console.error('[Contact] Database error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Ein Fehler ist aufgetreten'
      })
    }
    
    return {
      success: true,
      message: 'Nachricht erfolgreich gesendet'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('[Contact] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Ein Fehler ist aufgetreten'
    })
  }
})
