import { useState, useRef } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Download, Upload, Database } from 'lucide-react'

interface RestoreResult {
  message: string
  details?: string[]
}

export default function BackupPage() {
  useDocumentTitle('Backup & Restore')

  const [downloading, setDownloading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restoreData, setRestoreData] = useState(true)
  const [restoreStorage, setRestoreStorage] = useState(true)
  const [clearExisting, setClearExisting] = useState(false)
  const [result, setResult] = useState<RestoreResult | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownload = async () => {
    setDownloading(true)
    setError('')

    try {
      const apiBase = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${apiBase}/api/admin/backup`, {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Backup-Download fehlgeschlagen.')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const apiError = err as Error
      setError(apiError.message || 'Fehler beim Download.')
    } finally {
      setDownloading(false)
    }
  }

  const handleRestore = async () => {
    setError('')
    setResult(null)

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Bitte eine Backup-Datei (ZIP) auswaehlen.')
      return
    }

    if (!window.confirm('Backup wirklich wiederherstellen? Dies kann bestehende Daten ueberschreiben.')) {
      return
    }

    setRestoring(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append(
        'options',
        JSON.stringify({
          restoreData,
          restoreStorage,
          clearExisting,
        })
      )

      const apiBase = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${apiBase}/api/admin/backup/restore`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'Wiederherstellung fehlgeschlagen.')
      }

      const data: RestoreResult = await res.json()
      setResult(data)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: unknown) {
      const apiError = err as Error
      setError(apiError.message || 'Fehler bei der Wiederherstellung.')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Backup &amp; Restore</h1>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {result && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          <p className="font-semibold">{result.message}</p>
          {result.details && result.details.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-1">
              {result.details.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Download Backup */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <Database className="h-6 w-6 text-orange-500" />
          <h2 className="text-lg font-semibold">Backup herunterladen</h2>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Erstellt ein vollstaendiges Backup aller Daten und Dateien als ZIP-Archiv.
        </p>
        <Button onClick={handleDownload} disabled={downloading}>
          <Download className="h-4 w-4" />
          {downloading ? 'Wird erstellt...' : 'Backup herunterladen'}
        </Button>
      </div>

      {/* Restore Backup */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <Upload className="h-6 w-6 text-orange-500" />
          <h2 className="text-lg font-semibold">Backup wiederherstellen</h2>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Stellt Daten aus einer zuvor erstellten Backup-Datei wieder her.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-file">Backup-Datei (ZIP)</Label>
            <Input
              id="backup-file"
              type="file"
              accept=".zip"
              ref={fileInputRef}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Optionen</p>
            <div className="flex items-center gap-2">
              <input
                id="restore-data"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={restoreData}
                onChange={(e) => setRestoreData(e.target.checked)}
              />
              <Label htmlFor="restore-data">Daten wiederherstellen</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="restore-storage"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={restoreStorage}
                onChange={(e) => setRestoreStorage(e.target.checked)}
              />
              <Label htmlFor="restore-storage">Dateien wiederherstellen</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="clear-existing"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
              />
              <Label htmlFor="clear-existing">
                Bestehende Daten vorher loeschen
              </Label>
            </div>
          </div>

          <Button
            onClick={handleRestore}
            disabled={restoring}
            variant="destructive"
          >
            <Upload className="h-4 w-4" />
            {restoring ? 'Wird wiederhergestellt...' : 'Wiederherstellen'}
          </Button>
        </div>
      </div>
    </div>
  )
}
