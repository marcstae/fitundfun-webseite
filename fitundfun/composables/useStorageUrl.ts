/**
 * Composable für Storage-URLs, die sowohl im Docker-Netz (kong) als auch im Browser funktionieren.
 * Nutzt die Public-Runtime-Config statt manueller String-Hacks.
 */
export const useStorageUrl = () => {
  const config = useRuntimeConfig()
  const client = useSupabaseClient()

  const clientUrl = config.public.supabase.clientUrl as string
  const clientOrigin = safeOrigin(clientUrl)

  /**
   * Holt die öffentliche URL für eine Datei im Storage und rewritet sie bei Bedarf auf die Client-Origin.
   */
  const getPublicUrl = (bucket: string, path: string): string => {
    const { data } = client.storage.from(bucket).getPublicUrl(path)
    return rewriteToClientOrigin(data.publicUrl)
  }

  /**
   * Ersetzt kong:8000 (oder andere interne Hosts) durch die Client-Origin aus der Runtime-Config.
   */
  const rewriteToClientOrigin = (url: string): string => {
    if (!url || !clientOrigin) return url
    try {
      const parsed = new URL(url)
      const target = new URL(clientOrigin)

      // Nur umschreiben, wenn die URL offensichtlich aus dem internen Netz stammt
      if (parsed.host === 'kong:8000') {
        parsed.protocol = target.protocol
        parsed.host = target.host
        return parsed.toString()
      }

      return url
    } catch (_e) {
      return url
    }
  }

  return {
    getPublicUrl,
    fixStorageUrl: rewriteToClientOrigin,
  }
}

function safeOrigin(url?: string) {
  if (!url) return ''
  try {
    return new URL(url).origin
  } catch (_e) {
    return ''
  }
}
