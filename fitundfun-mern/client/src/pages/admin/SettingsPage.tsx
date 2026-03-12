import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { apiFetch, getImageUrl } from '@/lib/api'
import { validateImageFile } from '@/lib/fileValidation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save } from 'lucide-react'

interface Settings {
  siteTitle: string
  contactEmail: string
  heroImage: string
}

export default function SettingsPage() {
  useDocumentTitle('Einstellungen')

  const [settings, setSettings] = useState<Settings>({
    siteTitle: '',
    contactEmail: '',
    heroImage: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    apiFetch<Settings>('/api/admin/settings')
      .then((data) => setSettings(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const file = fileInputRef.current?.files?.[0]

    if (file) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        setError(validation.error || 'Ungueltige Datei.')
        setSaving(false)
        return
      }
    }

    try {
      const formData = new FormData()
      formData.append('siteTitle', settings.siteTitle)
      formData.append('contactEmail', settings.contactEmail)
      if (file) {
        formData.append('heroImage', file)
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/admin/settings`,
        {
          method: 'PUT',
          credentials: 'include',
          body: formData,
        }
      )

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || res.statusText)
      }

      const updated = await res.json()
      setSettings(updated)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setSuccess('Einstellungen gespeichert.')
    } catch (err: unknown) {
      const apiError = err as Error
      setError(apiError.message || 'Fehler beim Speichern.')
    } finally {
      setSaving(false)
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
      <h1 className="text-3xl font-bold text-slate-900">Einstellungen</h1>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">{success}</div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="site-title">Website-Titel</Label>
            <Input
              id="site-title"
              value={settings.siteTitle}
              onChange={(e) =>
                setSettings({ ...settings, siteTitle: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email">Kontakt E-Mail</Label>
            <Input
              id="contact-email"
              type="email"
              value={settings.contactEmail}
              onChange={(e) =>
                setSettings({ ...settings, contactEmail: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-image">Hero-Bild</Label>
            {settings.heroImage && (
              <div className="mb-2">
                <p className="mb-1 text-sm text-slate-500">Aktuelles Bild:</p>
                <img
                  src={getImageUrl(settings.heroImage)}
                  alt="Hero"
                  className="max-h-48 rounded-lg border border-slate-200 object-cover"
                />
              </div>
            )}
            <Input
              id="hero-image"
              type="file"
              accept="image/*"
              ref={fileInputRef}
            />
            <p className="text-xs text-slate-400">
              Optional. Nur auswaehlen, um das Bild zu ersetzen.
            </p>
          </div>

          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Speichern...' : 'Speichern'}
          </Button>
        </form>
      </div>
    </div>
  )
}
