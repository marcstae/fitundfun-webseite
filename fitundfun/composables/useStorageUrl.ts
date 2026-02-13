/**
 * Composable für Storage-URLs die sowohl auf Server als auch Client funktionieren.
 * 
 * Problem: Supabase Storage gibt URLs mit 'kong:8000' zurück (Docker intern),
 * aber der Browser kann diese Adresse nicht auflösen.
 * 
 * Lösung: URLs werden automatisch zu 'localhost:8000' (oder der konfigurierten Client-URL) umgeschrieben.
 */
export const useStorageUrl = () => {
  const config = useRuntimeConfig()
  const client = useSupabaseClient()
  
  /**
   * Holt die öffentliche URL für eine Datei im Storage.
   * Die URL wird automatisch für den Browser korrigiert.
   */
  const getPublicUrl = (bucket: string, path: string): string => {
    const { data } = client.storage.from(bucket).getPublicUrl(path)
    return fixStorageUrl(data.publicUrl)
  }
  
  /**
   * Korrigiert eine Storage-URL für den Browser.
   * Ersetzt kong:8000 mit der Client-URL (localhost:8000).
   */
  const fixStorageUrl = (url: string): string => {
    if (!url) return url
    
    // Nur auf Client-Seite die URL korrigieren
    if (import.meta.client) {
      const clientUrl = config.public.supabase.clientUrl as string
      if (clientUrl && url.includes('kong:8000')) {
        return url.replace(/http:\/\/kong:8000/g, clientUrl)
      }
    }
    
    return url
  }
  
  return {
    getPublicUrl,
    fixStorageUrl
  }
}
