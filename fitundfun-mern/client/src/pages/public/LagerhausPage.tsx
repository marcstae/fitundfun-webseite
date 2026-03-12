import { useState, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { apiFetch, getImageUrl } from '@/lib/api'

interface Lagerhaus {
  titel?: string
  beschreibung?: string
  bilder?: string[]
}

export default function LagerhausPage() {
  useDocumentTitle('Lagerhaus - Fit & Fun')

  const [lagerhaus, setLagerhaus] = useState<Lagerhaus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<Lagerhaus>('/api/public/lagerhaus')
      .then(setLagerhaus)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            {lagerhaus?.titel || 'Lagerhaus Crestneder'}
          </h1>
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <MapPin className="w-5 h-5 text-primary-600" />
            <span>Brigels, Graubünden</span>
          </div>
        </div>

        {/* Bilder Gallery */}
        {lagerhaus?.bilder && lagerhaus.bilder.length > 0 ? (
          <div className="mb-12">
            <div className="grid md:grid-cols-2 gap-4">
              {lagerhaus.bilder.map((bild, index) => (
                <img
                  key={index}
                  src={getImageUrl(bild)}
                  alt={`Lagerhaus Bild ${index + 1}`}
                  className="rounded-xl w-full h-64 object-cover"
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-12">
            <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
              <MapPin className="w-16 h-16 text-primary-400" />
            </div>
          </div>
        )}

        {/* Beschreibung */}
        {lagerhaus?.beschreibung ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
            <p className="text-slate-700 leading-relaxed whitespace-pre-line text-lg">
              {lagerhaus.beschreibung}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
            <p className="text-slate-700 leading-relaxed text-lg">
              Das Lagerhaus Crestneder in Brigels bietet den perfekten Rahmen für unser
              Familienlager. Mitten in den Bündner Bergen gelegen, ist es der ideale Ausgangspunkt
              für Skifahren, Snowboarden und viele weitere Winteraktivitäten.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
