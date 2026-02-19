/**
 * Route-Middleware: Schützt Admin-Seiten und leitet Login-Seite um.
 *
 * `useSupabaseUser()` funktioniert auf Server (liest JWT aus Cookie)
 * und Client (liest aus Supabase-Client-State) gleichermaßen.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const isAdminRoute = to.path.startsWith('/admin') && to.path !== '/admin/login'
  const isLoginPage = to.path === '/admin/login'

  if (!isAdminRoute && !isLoginPage) return

  const user = useSupabaseUser()

  if (!user.value && isAdminRoute) {
    return navigateTo('/admin/login')
  }

  if (user.value && isLoginPage) {
    return navigateTo('/admin')
  }
})

