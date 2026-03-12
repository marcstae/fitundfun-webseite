import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ExternalLink } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { apiFetch } from '@/lib/api'

interface Lager {
  id: string
  jahr: number
  titel?: string
  immichAlbumUrl?: string
}

export default function ArchivPage() {
  useDocumentTitle('Archiv - Fit & Fun')

  const [lagerList, setLagerList] = useState<Lager[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<Lager[]>('/api/public/lager/archiv')
      .then(setLagerList)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8 text-center">Bisherige Lager</h1>

        {lagerList.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lagerList.map((lager) => (
              <Link
                key={lager.id}
                to={`/archiv/${lager.jahr}`}
                className="group bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-lg hover:border-primary-300 transition-all"
              >
                {/* Cover Image Placeholder */}
                <div className="aspect-video bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                  <span className="text-5xl font-bold text-white/90">{lager.jahr}</span>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary-700 transition-colors">
                    {lager.titel || `Lager ${lager.jahr}`}
                  </h3>

                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span>{lager.jahr}</span>
                  </div>

                  {lager.immichAlbumUrl && (
                    <div className="flex items-center gap-1 mt-3 text-primary-600 text-sm">
                      <ExternalLink className="w-4 h-4" />
                      <span>Fotoalbum verfügbar</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            Noch keine archivierten Lager vorhanden.
          </div>
        )}
      </div>
    </div>
  )
}
