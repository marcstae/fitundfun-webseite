import { useState, useEffect } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { apiFetch } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Mail, Trash2, ExternalLink } from 'lucide-react'

interface Nachricht {
  _id: string
  name: string
  email: string
  betreff: string
  nachricht: string
  gelesen: boolean
  erstelltAm: string
}

export default function NachrichtenPage() {
  useDocumentTitle('Nachrichten')

  const [nachrichten, setNachrichten] = useState<Nachricht[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchNachrichten = async () => {
    try {
      const data = await apiFetch<Nachricht[]>('/api/admin/nachrichten')
      setNachrichten(
        data.sort(
          (a, b) =>
            new Date(b.erstelltAm).getTime() - new Date(a.erstelltAm).getTime()
        )
      )
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNachrichten()
  }, [])

  const selectedMessage = nachrichten.find((n) => n._id === selectedId)

  const handleSelect = async (nachricht: Nachricht) => {
    setSelectedId(nachricht._id)

    if (!nachricht.gelesen) {
      try {
        await apiFetch(`/api/admin/nachrichten/${nachricht._id}/read`, {
          method: 'PATCH',
        })
        setNachrichten((prev) =>
          prev.map((n) =>
            n._id === nachricht._id ? { ...n, gelesen: true } : n
          )
        )
      } catch {
        // ignore
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Diese Nachricht wirklich loeschen?')) return

    try {
      await apiFetch(`/api/admin/nachrichten/${id}`, { method: 'DELETE' })
      if (selectedId === id) setSelectedId(null)
      await fetchNachrichten()
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
      <h1 className="text-3xl font-bold text-slate-900">Nachrichten</h1>

      <div className="grid h-[calc(100vh-220px)] grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Message list */}
        <div className="overflow-y-auto rounded-xl border border-slate-200 bg-white lg:col-span-1">
          {nachrichten.length === 0 ? (
            <p className="px-6 py-12 text-center text-slate-500">
              Keine Nachrichten vorhanden.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {nachrichten.map((msg) => (
                <li
                  key={msg._id}
                  onClick={() => handleSelect(msg)}
                  className={`cursor-pointer px-4 py-3 transition-colors hover:bg-slate-50 ${
                    selectedId === msg._id ? 'bg-slate-100' : ''
                  } ${!msg.gelesen ? 'bg-orange-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${
                          !msg.gelesen ? 'font-bold text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {msg.name}
                      </p>
                      <p
                        className={`truncate text-sm ${
                          !msg.gelesen ? 'font-semibold text-slate-800' : 'text-slate-600'
                        }`}
                      >
                        {msg.betreff}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDateTime(msg.erstelltAm)}
                      </p>
                    </div>
                    {!msg.gelesen && (
                      <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Message detail */}
        <div className="overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          {selectedMessage ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedMessage.betreff}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Von: {selectedMessage.name} &lt;{selectedMessage.email}&gt;
                  </p>
                  <p className="text-sm text-slate-400">
                    {formatDateTime(selectedMessage.erstelltAm)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.betreff)}`}
                    title="Antworten"
                  >
                    <Button variant="outline" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(selectedMessage._id)}
                    title="Loeschen"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              <hr className="border-slate-200" />

              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {selectedMessage.nachricht}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <Mail className="mb-3 h-12 w-12" />
              <p>Nachricht auswaehlen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
