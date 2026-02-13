/**
 * Plugin um alle Fetch-Requests an kong:8000 zu localhost:8000 umzuleiten.
 * 
 * Problem: Der Server verwendet 'kong:8000' (Docker intern),
 * aber der Browser kann diese Adresse nicht auflösen.
 * Der Supabase Client ist bereits mit kong:8000 initialisiert.
 * 
 * Lösung: Wir überschreiben die globale fetch Funktion um alle
 * Requests an kong:8000 zu localhost:8000 umzuleiten.
 */
export default defineNuxtPlugin({
  name: 'supabase-url-override',
  enforce: 'pre',
  setup() {
    const config = useRuntimeConfig()
    const clientUrl = config.public.supabase.clientUrl as string
    
    if (!clientUrl) {
      return
    }

    // Speichere die originale fetch Funktion
    const originalFetch = window.fetch.bind(window)
    
    // Überschreibe fetch global
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let url = typeof input === 'string' 
        ? input 
        : input instanceof URL 
          ? input.toString() 
          : input.url

      // Ersetze kong:8000 mit localhost:8000
      if (url.includes('kong:8000')) {
        const newUrl = url.replace(/http:\/\/kong:8000/g, clientUrl)
        
        // Erstelle neuen Request mit korrigierter URL
        if (typeof input === 'string') {
          input = newUrl
        } else if (input instanceof URL) {
          input = new URL(newUrl)
        } else {
          // Request object - erstelle neuen Request
          input = new Request(newUrl, input)
        }
      }
      
      return originalFetch(input, init)
    }
  }
})
