import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Download, ExternalLink, Calendar, ArrowLeft } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { apiFetch, getPdfUrl } from '@/lib/api'
import { formatDate } from '@/lib/format'

interface LagerDownload {
  id: string
  titel: string
  filePath: string
}

interface Lager {
  id: string
  jahr: number
  titel?: string
  datumVon: string
  datumBis: string
  beschreibung?: string
  immichAlbumUrl?: string
  downloads: LagerDownload[]
}

export default function ArchivDetailPage() {
  const { jahr } = useParams<{ jahr: string }>()

  const [lager, setLager] = useState<Lager | null>(null)
  const [loading, setLoading] = useState(true)

  useDocumentTitle(lager ? `Lager ${lager.jahr} - Fit & Fun` : `Lager ${jahr} - Fit & Fun`)

  useEffect(() => {
    if (!jahr) return
    apiFetch<Lager>(`/api/public/lager/${jahr}`)
      .then(setLager)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [jahr])

  if (loading) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          to="/archiv"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-primary-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Archiv
        </Link>

        {lager ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900 mb-4">
                {lager.titel || `Lager ${lager.jahr}`}
              </h1>

              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-5 h-5 text-primary-600" />
                <span>
                  {formatDate(lager.datumVon)} - {formatDate(lager.datumBis)}
                </span>
              </div>
            </div>

            {/* Beschreibung */}
            {lager.beschreibung && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {lager.beschreibung}
                </p>
              </div>
            )}

            {/* Downloads */}
            {lager.downloads && lager.downloads.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-slate-900 mb-6">Downloads</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {lager.downloads.map((download) => (
                    <a
                      key={download.id}
                      href={getPdfUrl(download.filePath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-white rounded-lg p-4 border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all group"
                    >
                      <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                        <Download className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="font-medium text-slate-700 group-hover:text-orange-600 transition-colors">
                        {download.titel}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Fotoalbum */}
            {lager.immichAlbumUrl && (
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
                <h2 className="text-xl font-semibold mb-2">Fotoalbum</h2>
                <p className="text-primary-100 mb-4">
                  Alle Fotos vom Lager {lager.jahr} ansehen und herunterladen.
                </p>
                <a
                  href={lager.immichAlbumUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                >
                  Zum Fotoalbum
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </>
        ) : (
          /* Not Found */
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">Lager {jahr} nicht gefunden.</p>
            <Link
              to="/archiv"
              className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              &larr; Zurück zum Archiv
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
