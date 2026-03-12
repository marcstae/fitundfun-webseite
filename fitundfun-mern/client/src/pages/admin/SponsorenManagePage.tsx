import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { apiFetch, apiUpload, getImageUrl } from '@/lib/api'
import { validateImageFile } from '@/lib/fileValidation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Sponsor {
  _id: string
  name: string
  websiteUrl: string
  reihenfolge: number
  logo: string
}

interface SponsorForm {
  name: string
  websiteUrl: string
  reihenfolge: number
}

const emptyForm: SponsorForm = {
  name: '',
  websiteUrl: '',
  reihenfolge: 0,
}

export default function SponsorenManagePage() {
  useDocumentTitle('Sponsoren verwalten')

  const [sponsoren, setSponsoren] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SponsorForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchSponsoren = async () => {
    try {
      const data = await apiFetch<Sponsor[]>('/api/admin/sponsoren')
      setSponsoren(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSponsoren()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (sponsor: Sponsor) => {
    setEditingId(sponsor._id)
    setForm({
      name: sponsor.name,
      websiteUrl: sponsor.websiteUrl || '',
      reihenfolge: sponsor.reihenfolge,
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const file = fileInputRef.current?.files?.[0]

    if (!editingId && !file) {
      setError('Bitte ein Logo auswaehlen.')
      setSaving(false)
      return
    }

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
      formData.append('name', form.name)
      formData.append('websiteUrl', form.websiteUrl)
      formData.append('reihenfolge', String(form.reihenfolge))
      if (file) {
        formData.append('logo', file)
      }

      if (editingId) {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || ''}/api/admin/sponsoren/${editingId}`,
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
      } else {
        await apiUpload('/api/admin/sponsoren', formData)
      }

      setShowModal(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await fetchSponsoren()
    } catch (err: unknown) {
      const apiError = err as Error
      setError(apiError.message || 'Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Diesen Sponsor wirklich loeschen?')) return

    try {
      await apiFetch(`/api/admin/sponsoren/${id}`, { method: 'DELETE' })
      await fetchSponsoren()
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Sponsoren verwalten</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Neuer Sponsor
        </Button>
      </div>

      {sponsoren.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-500">
          Keine Sponsoren vorhanden.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sponsoren.map((sponsor) => (
            <div
              key={sponsor._id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="mb-3 flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                {sponsor.logo ? (
                  <img
                    src={getImageUrl(sponsor.logo)}
                    alt={sponsor.name}
                    className="max-h-full max-w-full object-contain p-2"
                  />
                ) : (
                  <span className="text-sm text-slate-400">Kein Logo</span>
                )}
              </div>
              <h3 className="font-semibold">{sponsor.name}</h3>
              {sponsor.websiteUrl && (
                <p className="mt-1 truncate text-sm text-slate-500">
                  {sponsor.websiteUrl}
                </p>
              )}
              <p className="mt-1 text-sm text-slate-400">
                Reihenfolge: {sponsor.reihenfolge}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(sponsor)}
                >
                  <Pencil className="h-4 w-4" />
                  Bearbeiten
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(sponsor._id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">
              {editingId ? 'Sponsor bearbeiten' : 'Neuer Sponsor'}
            </h2>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sp-name">Name</Label>
                <Input
                  id="sp-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sp-url">Website URL</Label>
                <Input
                  id="sp-url"
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sp-reihenfolge">Reihenfolge</Label>
                <Input
                  id="sp-reihenfolge"
                  type="number"
                  value={form.reihenfolge}
                  onChange={(e) =>
                    setForm({ ...form, reihenfolge: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sp-logo">
                  Logo {editingId ? '(optional, nur zum Ersetzen)' : ''}
                </Label>
                <Input
                  id="sp-logo"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Speichern...' : 'Speichern'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
