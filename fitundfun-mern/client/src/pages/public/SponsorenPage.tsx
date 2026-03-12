import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { apiFetch, getImageUrl } from '@/lib/api'

interface Sponsor {
  id: string
  name: string
  logoUrl?: string
  websiteUrl?: string
}

export default function SponsorenPage() {
  useDocumentTitle('Sponsoren - Fit & Fun')

  const [sponsoren, setSponsoren] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<Sponsor[]>('/api/public/sponsoren')
      .then(setSponsoren)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Unsere Sponsoren</h1>
          <p className="text-lg text-slate-600">
            Herzlichen Dank an alle, die das Fit & Fun Lager unterstützen!
          </p>
        </div>

        {sponsoren.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sponsoren.map((sponsor) => (
              <a
                key={sponsor.id}
                href={sponsor.websiteUrl || '#'}
                target={sponsor.websiteUrl ? '_blank' : undefined}
                rel={sponsor.websiteUrl ? 'noopener' : undefined}
                className={`group bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-lg hover:border-primary-300 transition-all flex flex-col items-center text-center${
                  !sponsor.websiteUrl ? ' cursor-default' : ''
                }`}
              >
                {/* Logo */}
                <div className="w-32 h-32 flex items-center justify-center mb-4">
                  {sponsor.logoUrl ? (
                    <img
                      src={getImageUrl(sponsor.logoUrl)}
                      alt={sponsor.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-400">
                        {sponsor.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3 className="font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">
                  {sponsor.name}
                </h3>

                {/* Link indicator */}
                {sponsor.websiteUrl && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-primary-600">
                    <ExternalLink className="w-3 h-3" />
                    <span>Website besuchen</span>
                  </div>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            Noch keine Sponsoren eingetragen.
          </div>
        )}
      </div>
    </div>
  )
}
