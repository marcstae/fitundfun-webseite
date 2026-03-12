import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { apiFetch, apiUpload, getImageUrl } from '@/lib/api'
import { validateImageFile } from '@/lib/fileValidation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Trash2, Save } from 'lucide-react'

interface Lagerhaus {
  titel: string
  beschreibung: string
  bilder: string[]
}

export default function LagerhausManagePage() {
  useDocumentTitle('Lagerhaus verwalten')

  const [lagerhaus, setLagerhaus] = useState<Lagerhaus>({
    titel: '',
    beschreibung: '',
    bilder: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchLagerhaus = async () => {
    try {
      const data = await apiFetch<Lagerhaus>('/api/admin/lagerhaus')
      setLagerhaus(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLagerhaus()
  }, [])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await apiFetch('/api/admin/lagerhaus', {
        method: 'PUT',
        body: JSON.stringify({
          titel: lagerhaus.titel,
          beschreibung: lagerhaus.beschreibung,
        }),
      })
      setSuccess('Lagerhaus gespeichert.')
    } catch (err: unknown) {
      const apiError = err as Error
      setError(apiError.message || 'Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async () => {
    setError('')
    setSuccess('')

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Bitte ein Bild auswaehlen.')
      return
    }

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Ungueltige Datei.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      await apiUpload('/api/admin/lagerhaus/images', formData)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await fetchLagerhaus()
      setSuccess('Bild hochgeladen.')
    } catch (err: unknown) {
      const apiError = err as Error
      setError(apiError.message || 'Fehler beim Hochladen.')
    } finally {
      setUploading(false)
    }
  }

  const handleImageDelete = async (index: number) => {
    if (!window.confirm('Dieses Bild wirklich loeschen?')) return

    try {
      await apiFetch(`/api/admin/lagerhaus/images/${index}`, { method: 'DELETE' })
      await fetchLagerhaus()
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
      <h1 className="text-3xl font-bold text-slate-900">Lagerhaus verwalten</h1>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">{success}</div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Informationen</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lh-titel">Titel</Label>
            <Input
              id="lh-titel"
              value={lagerhaus.titel}
              onChange={(e) =>
                setLagerhaus({ ...lagerhaus, titel: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lh-beschreibung">Beschreibung</Label>
            <textarea
              id="lh-beschreibung"
              className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              value={lagerhaus.beschreibung}
              onChange={(e) =>
                setLagerhaus({ ...lagerhaus, beschreibung: e.target.value })
              }
            />
          </div>

          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Speichern...' : 'Speichern'}
          </Button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Bilder</h2>

        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="lh-image">Neues Bild hochladen</Label>
            <Input
              id="lh-image"
              type="file"
              accept="image/*"
              ref={fileInputRef}
            />
          </div>
          <Button onClick={handleImageUpload} disabled={uploading}>
            <Upload className="h-4 w-4" />
            {uploading ? 'Hochladen...' : 'Hochladen'}
          </Button>
        </div>

        {lagerhaus.bilder.length === 0 ? (
          <p className="text-sm text-slate-500">Keine Bilder vorhanden.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {lagerhaus.bilder.map((bild, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg border border-slate-200"
              >
                <img
                  src={getImageUrl(bild)}
                  alt={`Lagerhaus Bild ${index + 1}`}
                  className="aspect-video w-full object-cover"
                />
                <button
                  onClick={() => handleImageDelete(index)}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                  title="Bild loeschen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
