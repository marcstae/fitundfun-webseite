import { useState, useEffect, type FormEvent } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { apiFetch } from '@/lib/api'
import { formatDateShort } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'

interface Lager {
  _id: string
  jahr: number
  titel: string
  datumVon: string
  datumBis: string
  beschreibung: string
  preis: number
  immichAlbumUrl: string
  istAktuell: boolean
}

interface LagerForm {
  jahr: number
  titel: string
  datumVon: string
  datumBis: string
  beschreibung: string
  preis: number
  immichAlbumUrl: string
  istAktuell: boolean
}

const emptyForm: LagerForm = {
  jahr: new Date().getFullYear(),
  titel: '',
  datumVon: '',
  datumBis: '',
  beschreibung: '',
  preis: 0,
  immichAlbumUrl: '',
  istAktuell: false,
}

export default function LagerManagePage() {
  useDocumentTitle('Lager verwalten')

  const [lagerList, setLagerList] = useState<Lager[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<LagerForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchLager = async () => {
    try {
      const data = await apiFetch<Lager[]>('/api/admin/lager')
      setLagerList(data.sort((a, b) => b.jahr - a.jahr))
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLager()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (lager: Lager) => {
    setEditingId(lager._id)
    setForm({
      jahr: lager.jahr,
      titel: lager.titel,
      datumVon: lager.datumVon ? lager.datumVon.slice(0, 10) : '',
      datumBis: lager.datumBis ? lager.datumBis.slice(0, 10) : '',
      beschreibung: lager.beschreibung || '',
      preis: lager.preis,
      immichAlbumUrl: lager.immichAlbumUrl || '',
      istAktuell: lager.istAktuell,
    })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editingId) {
        await apiFetch(`/api/admin/lager/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        })
      } else {
        await apiFetch('/api/admin/lager', {
          method: 'POST',
          body: JSON.stringify(form),
        })
      }
      setShowModal(false)
      await fetchLager()
    } catch (err: unknown) {
      const apiError = err as Error
      setError(apiError.message || 'Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Dieses Lager wirklich loeschen?')) return

    try {
      await apiFetch(`/api/admin/lager/${id}`, { method: 'DELETE' })
      await fetchLager()
    } catch {
      // ignore
    }
  }

  const toggleAktuell = async (id: string) => {
    try {
      await apiFetch(`/api/admin/lager/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ istAktuell: true }),
      })
      await fetchLager()
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
        <h1 className="text-3xl font-bold text-slate-900">Lager verwalten</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Neues Lager
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">Jahr</th>
              <th className="px-4 py-3 font-medium text-slate-600">Titel</th>
              <th className="px-4 py-3 font-medium text-slate-600">Datum</th>
              <th className="px-4 py-3 font-medium text-slate-600">Aktuell</th>
              <th className="px-4 py-3 font-medium text-slate-600">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {lagerList.map((lager) => (
              <tr key={lager._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">{lager.jahr}</td>
                <td className="px-4 py-3 font-medium">{lager.titel}</td>
                <td className="px-4 py-3">
                  {formatDateShort(lager.datumVon)} - {formatDateShort(lager.datumBis)}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAktuell(lager._id)}
                    title="Als aktuell markieren"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        lager.istAktuell
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300 hover:text-yellow-400'
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(lager)}
                      title="Bearbeiten"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(lager._id)}
                      title="Loeschen"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {lagerList.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Keine Lager vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">
              {editingId ? 'Lager bearbeiten' : 'Neues Lager erstellen'}
            </h2>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jahr">Jahr</Label>
                  <Input
                    id="jahr"
                    type="number"
                    value={form.jahr}
                    onChange={(e) => setForm({ ...form, jahr: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preis">Preis (CHF)</Label>
                  <Input
                    id="preis"
                    type="number"
                    step="0.01"
                    value={form.preis}
                    onChange={(e) => setForm({ ...form, preis: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titel">Titel</Label>
                <Input
                  id="titel"
                  value={form.titel}
                  onChange={(e) => setForm({ ...form, titel: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="datumVon">Datum von</Label>
                  <Input
                    id="datumVon"
                    type="date"
                    value={form.datumVon}
                    onChange={(e) => setForm({ ...form, datumVon: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="datumBis">Datum bis</Label>
                  <Input
                    id="datumBis"
                    type="date"
                    value={form.datumBis}
                    onChange={(e) => setForm({ ...form, datumBis: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="beschreibung">Beschreibung</Label>
                <textarea
                  id="beschreibung"
                  className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                  value={form.beschreibung}
                  onChange={(e) => setForm({ ...form, beschreibung: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="immichAlbumUrl">Immich Album URL</Label>
                <Input
                  id="immichAlbumUrl"
                  type="url"
                  value={form.immichAlbumUrl}
                  onChange={(e) => setForm({ ...form, immichAlbumUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="istAktuell"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={form.istAktuell}
                  onChange={(e) => setForm({ ...form, istAktuell: e.target.checked })}
                />
                <Label htmlFor="istAktuell">Ist aktuelles Lager</Label>
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
