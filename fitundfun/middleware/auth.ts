export default defineNuxtRouteMiddleware(async (to) => {
  // Prüfe ob wir auf einer Admin-Route sind (außer Login)
  const isAdminRoute = to.path.startsWith('/admin') && to.path !== '/admin/login'
  const isLoginPage = to.path === '/admin/login'
  
  // Für Nicht-Admin-Routen keine Prüfung nötig
  if (!isAdminRoute && !isLoginPage) {
    return
  }

  let isAuthenticated = false

  if (import.meta.server) {
    // Server-seitig: Prüfe via interner API (verwendet Cookies)
    try {
      const { authenticated } = await $fetch('/api/auth/me', {
        headers: useRequestHeaders(['cookie'])
      })
      isAuthenticated = authenticated
    } catch (_error) {
      isAuthenticated = false
    }
  } else {
    // Client-seitig: Prüfe via Supabase User State
    const user = useSupabaseUser()
    isAuthenticated = !!user.value
  }

  // Wenn nicht eingeloggt und Admin-Route, redirect zu Login
  if (!isAuthenticated && isAdminRoute) {
    return navigateTo('/admin/login')
  }

  // Wenn eingeloggt und auf Login-Seite, redirect zu Admin Dashboard
  if (isAuthenticated && isLoginPage) {
    return navigateTo('/admin')
  }
})

