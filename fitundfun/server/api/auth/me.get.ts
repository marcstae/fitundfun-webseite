import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    
    return {
      authenticated: !!user,
      user: user ? {
        id: user.sub,
        email: user.email,
        role: user.role,
      } : null
    }
  } catch (error) {
    // Bei Fehlern (z.B. kein Token) ist der User nicht authentifiziert
    return {
      authenticated: false,
      user: null
    }
  }
})
