import { serverSupabaseClient } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

interface BackupManifest {
  version: string
  created_at: string
  created_by: string
  tables: string[]
  storage_buckets: string[]
}

interface RestoreOptions {
  restore_data: boolean
  restore_storage: boolean
  clear_existing: boolean
}

/**
 * Restore API - Stellt ein Backup wieder her
 * 
 * Erwartet eine multipart/form-data Anfrage mit:
 * - file: Die ZIP-Backup-Datei
 * - options: JSON mit Restore-Optionen
 */
export default defineEventHandler(async (event) => {
  // Authentifizierung prüfen
  const client = await serverSupabaseClient(event)
  const { data: { user }, error: authError } = await client.auth.getUser()
  
  if (authError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Nicht autorisiert'
    })
  }

  try {
    // Multipart-Formular lesen
    const formData = await readMultipartFormData(event)
    
    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Keine Datei hochgeladen'
      })
    }

    // Datei und Optionen extrahieren
    let zipBuffer: Buffer | null = null
    let options: RestoreOptions = {
      restore_data: true,
      restore_storage: true,
      clear_existing: false
    }

    for (const field of formData) {
      if (field.name === 'file' && field.data) {
        zipBuffer = field.data
      } else if (field.name === 'options' && field.data) {
        try {
          options = JSON.parse(field.data.toString())
        } catch (e) {
          // Standard-Optionen verwenden
        }
      }
    }

    if (!zipBuffer) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Keine Backup-Datei gefunden'
      })
    }

    // ZIP entpacken
    const zip = await JSZip.loadAsync(zipBuffer)
    
    // Manifest lesen
    const manifestFile = zip.file('manifest.json')
    if (!manifestFile) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ungültige Backup-Datei: manifest.json fehlt'
      })
    }

    const manifest: BackupManifest = JSON.parse(await manifestFile.async('string'))
    
    // Service Role Client manuell erstellen
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Supabase nicht korrekt konfiguriert'
      })
    }
    
    const serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const results = {
      manifest,
      restored_tables: [] as string[],
      restored_files: [] as string[],
      errors: [] as string[]
    }

    // ============================================
    // 1. Datenbank-Daten wiederherstellen
    // ============================================
    if (options.restore_data) {
      // Reihenfolge wichtig wegen Foreign Keys
      const tableOrder = ['settings', 'lagerhaus', 'sponsoren', 'lager', 'lager_downloads', 'kontakt_nachrichten']
      
      for (const table of tableOrder) {
        const dataFile = zip.file(`data/${table}.json`)
        if (!dataFile) continue

        try {
          const data = JSON.parse(await dataFile.async('string'))
          
          if (!Array.isArray(data) || data.length === 0) {
            continue
          }

          // Bestehende Daten löschen wenn gewünscht
          if (options.clear_existing) {
            const { error: deleteError } = await serviceClient
              .from(table)
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000') // Alle löschen
            
            if (deleteError) {
              results.errors.push(`Fehler beim Löschen von ${table}: ${deleteError.message}`)
            }
          }

          // Daten einfügen (upsert für Konflikte)
          const { error: insertError } = await serviceClient
            .from(table)
            .upsert(data, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })
          
          if (insertError) {
            results.errors.push(`Fehler beim Wiederherstellen von ${table}: ${insertError.message}`)
          } else {
            results.restored_tables.push(table)
          }
        } catch (e: any) {
          results.errors.push(`Fehler bei ${table}: ${e.message}`)
        }
      }
    }

    // ============================================
    // 2. Storage-Dateien wiederherstellen
    // ============================================
    if (options.restore_storage) {
      const buckets = ['images', 'pdfs']
      
      for (const bucket of buckets) {
        const storageFolder = zip.folder(`storage/${bucket}`)
        if (!storageFolder) continue

        // Bestehende Dateien löschen wenn gewünscht
        if (options.clear_existing) {
          try {
            const { data: existingFiles } = await serviceClient
              .storage
              .from(bucket)
              .list('', { limit: 1000 })
            
            if (existingFiles && existingFiles.length > 0) {
              const filePaths = existingFiles
                .filter(f => f.id !== null)
                .map(f => f.name)
              
              if (filePaths.length > 0) {
                await serviceClient.storage.from(bucket).remove(filePaths)
              }
            }
          } catch (e: any) {
            results.errors.push(`Fehler beim Löschen in ${bucket}: ${e.message}`)
          }
        }

        // Alle Dateien aus dem ZIP für diesen Bucket
        const prefix = `storage/${bucket}/`
        const files = Object.keys(zip.files).filter(
          path => path.startsWith(prefix) && !path.endsWith('/')
        )

        for (const filePath of files) {
          const file = zip.file(filePath)
          if (!file) continue

          try {
            const fileData = await file.async('nodebuffer')
            const storagePath = filePath.replace(prefix, '')
            
            // MIME-Type ermitteln
            const mimeType = getMimeType(storagePath)

            const { error: uploadError } = await serviceClient
              .storage
              .from(bucket)
              .upload(storagePath, fileData, {
                contentType: mimeType,
                upsert: true
              })
            
            if (uploadError) {
              results.errors.push(`Fehler beim Upload von ${bucket}/${storagePath}: ${uploadError.message}`)
            } else {
              results.restored_files.push(`${bucket}/${storagePath}`)
            }
          } catch (e: any) {
            results.errors.push(`Fehler bei Datei ${filePath}: ${e.message}`)
          }
        }
      }
    }

    return {
      success: true,
      message: 'Backup wiederhergestellt',
      results
    }

  } catch (error: any) {
    console.error('[Restore] Fehler:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Wiederherstellen des Backups'
    })
  }
})

/**
 * MIME-Type anhand der Dateiendung ermitteln
 */
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'json': 'application/json',
    'txt': 'text/plain'
  }
  
  return mimeTypes[ext || ''] || 'application/octet-stream'
}
