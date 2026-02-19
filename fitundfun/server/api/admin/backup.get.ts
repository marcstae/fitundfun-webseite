import { serverSupabaseServiceRole } from '#supabase/server'
import archiver from 'archiver'

/**
 * Backup API - Erstellt ein vollständiges Backup aller Daten
 * 
 * Das Backup enthält:
 * - manifest.json: Metadaten über das Backup
 * - data/: Alle Datenbank-Tabellen als JSON
 * - storage/: Alle Dateien aus den Storage Buckets
 */
export default defineEventHandler(async (event) => {
  // Auth wird durch server/middleware/admin-guard.ts sichergestellt
  const auth = event.context.auth

  try {
    const serviceClient = await serverSupabaseServiceRole(event)
    
    // Backup-Metadaten
    const manifest = {
      version: '1.0',
      created_at: new Date().toISOString(),
      created_by: auth?.email || 'unknown',
      tables: [] as string[],
      storage_buckets: [] as string[]
    }

    // ============================================
    // 1. Datenbank-Daten exportieren
    // ============================================
    const tables = ['settings', 'lager', 'lager_downloads', 'lagerhaus', 'sponsoren', 'kontakt_nachrichten']
    const dbData: Record<string, any[]> = {}

    for (const table of tables) {
      const { data, error } = await serviceClient
        .from(table)
        .select('*')
      
      if (error) {
        console.error(`Fehler beim Export von ${table}:`, error)
        dbData[table] = []
      } else {
        dbData[table] = data || []
        manifest.tables.push(table)
      }
    }

    // ============================================
    // 2. Storage-Dateien auflisten
    // ============================================
    const buckets = ['images', 'pdfs']
    const storageFiles: Record<string, { name: string; data: Buffer }[]> = {}

    for (const bucket of buckets) {
      storageFiles[bucket] = []
      
      try {
        // Alle Dateien im Bucket auflisten (rekursiv)
        const { data: files, error: listError } = await serviceClient
          .storage
          .from(bucket)
          .list('', { limit: 1000 })
        
        if (listError) {
          console.error(`Fehler beim Auflisten von ${bucket}:`, listError)
          continue
        }

        if (!files || files.length === 0) continue

        // Dateien und Unterordner durchgehen
        const allFiles = await listFilesRecursively(serviceClient, bucket, '', files)
        
        // Dateien herunterladen
        for (const filePath of allFiles) {
          try {
            const { data: fileData, error: downloadError } = await serviceClient
              .storage
              .from(bucket)
              .download(filePath)
            
            if (downloadError || !fileData) {
              console.error(`Fehler beim Download von ${bucket}/${filePath}:`, downloadError)
              continue
            }

            const buffer = Buffer.from(await fileData.arrayBuffer())
            storageFiles[bucket].push({ name: filePath, data: buffer })
          } catch (e) {
            console.error(`Fehler beim Download von ${bucket}/${filePath}:`, e)
          }
        }

        if (storageFiles[bucket].length > 0) {
          manifest.storage_buckets.push(bucket)
        }
      } catch (e) {
        console.error(`Fehler beim Verarbeiten von Bucket ${bucket}:`, e)
      }
    }

    // ============================================
    // 3. ZIP-Archiv erstellen
    // ============================================
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []

    archive.on('data', (chunk) => chunks.push(chunk))
    
    // Manifest hinzufügen
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' })

    // Datenbank-Daten hinzufügen
    for (const [table, data] of Object.entries(dbData)) {
      archive.append(JSON.stringify(data, null, 2), { name: `data/${table}.json` })
    }

    // Storage-Dateien hinzufügen
    for (const [bucket, files] of Object.entries(storageFiles)) {
      for (const file of files) {
        archive.append(file.data, { name: `storage/${bucket}/${file.name}` })
      }
    }

    await archive.finalize()

    // Auf Abschluss warten
    await new Promise<void>((resolve) => {
      archive.on('end', resolve)
    })

    const zipBuffer = Buffer.concat(chunks)

    // ============================================
    // 4. ZIP als Download senden
    // ============================================
    const filename = `fitundfun-backup-${new Date().toISOString().split('T')[0]}.zip`
    
    setResponseHeaders(event, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(zipBuffer.length)
    })

    return zipBuffer

  } catch (error: any) {
    console.error('[Backup] Fehler:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Erstellen des Backups'
    })
  }
})

/**
 * Hilfsfunktion: Dateien rekursiv auflisten
 */
async function listFilesRecursively(
  client: any,
  bucket: string,
  prefix: string,
  items: any[]
): Promise<string[]> {
  const files: string[] = []

  for (const item of items) {
    const path = prefix ? `${prefix}/${item.name}` : item.name

    if (item.id === null) {
      // Es ist ein Ordner - rekursiv durchsuchen
      const { data: subItems } = await client
        .storage
        .from(bucket)
        .list(path, { limit: 1000 })
      
      if (subItems && subItems.length > 0) {
        const subFiles = await listFilesRecursively(client, bucket, path, subItems)
        files.push(...subFiles)
      }
    } else {
      // Es ist eine Datei
      files.push(path)
    }
  }

  return files
}
