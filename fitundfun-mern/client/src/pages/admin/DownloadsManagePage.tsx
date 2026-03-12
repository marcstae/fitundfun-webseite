import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { apiFetch, apiUpload, getPdfUrl } from '@/lib/api'
import { validatePdfFile } from '@/lib/fileValidation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Trash2, FileText } from 'lucide-react'

interface Lager {
  _id: string
  titel: string
  jahr: number
}

interface Download {
  _id: string
  titel: string
  dateiPfad: string
}

export default function DownloadsManagePage() {
  useDocumentTitle('Downloads verwalten')

  const [lagerList, setLagerList] = useState<Lager[]>([])
  const [selectedLagerId, setSelectedLagerId] = useState('')
  const [downloads, setDownloads] = useState<Download[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [titel, setTitel] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiFetch<Lager[]>('/api/admin/lager')
      .then((data) => {
        const sorted = data.sort((a, b) => b.jahr - a.jahr)
        setLagerList(sorted)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fetchDownloads = async (lagerId: string) => {
    if (!lagerId) {
      setDownloads([])
      return
    }
    try {
      const data = await apiFetch<Download[]>(`/api/admin/downloads/${lagerId}`)
      setDownloads(data)
    } catch {
      setDownloads([])
    }
  }

  const handleLagerChange = (lagerId: string) => {
    setSelectedLagerId(lagerId)
    setError('')
    fetchDownloads(lagerId)
  }

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedLagerId) {
      setError('Bitte zuerst ein Lager auswaehlen.')
      return
    }

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Bitte eine Datei auswaehlen.')
      return
    }

    const validation = validatePdfFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Ungueltige Datei.')
      return
    }

    if (!titel.trim()) {
      setError('Bitte einen Titel eingeben.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('titel', titel.trim())

      await apiUpload(`/api/admin/downloads/${selectedLagerId}`, formData)
      setTitel('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      await fetchDownloads(selectedLagerId)
    } catch (err: unknown) {
      const apiError = err as Error
      setError(apiError.message || 'Fehler beim Hochladen.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Diesen Download wirklich loeschen?')) return

    try {
      await apiFetch(`/api/admin/downloads/${id}`, { method: 'DELETE' })
      await fetchDownloads(selectedLagerId)
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Laden...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Downloads verwalten</h1>

      <div className="space-y-2">
        <Label htmlFor="lager-select">Lager auswaehlen</Label>
        <select
          id="lager-select"
          className="flex h-10 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          value={selectedLagerId}
          onChange={(e) => handleLagerChange(e.target.value)}
        >
          <option value="">-- Lager waehlen --</option>
          {lagerList.map((lager) => (
            <option key={lager._id} value={lager._id}>
              {lager.jahr} - {lager.titel}
            </option>
          ))}
        </select>
      </div>

      {selectedLagerId && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Neuen Download hochladen</h2>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="download-titel">Titel</Label>
                <Input
                  id="download-titel"
                  value={titel}
                  onChange={(e) => setTitel(e.target.value)}
                  placeholder="z.B. Anmeldeformular"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="download-file">PDF-Datei</Label>
                <Input
                  id="download-file"
                  type="file"
                  accept=".pdf"
                  ref={fileInputRef}
                  required
                />
              </div>
              <Button type="submit" disabled={uploading}>
                <Upload className="h-4 w-4" />
                {uploading ? 'Hochladen...' : 'Hochladen'}
              </Button>
            </form>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold">Vorhandene Downloads</h2>
            </div>
            {downloads.length === 0 ? (
              <p className="px-6 py-8 text-center text-slate-500">
                Keine Downloads vorhanden.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {downloads.map((dl) => (
                  <li
                    key={dl._id}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <a
                        href={getPdfUrl(dl.dateiPfad)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary-600 hover:underline"
                      >
                        {dl.titel}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(dl._id)}
                      title="Loeschen"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
