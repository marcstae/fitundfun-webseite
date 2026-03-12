import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, MapPin, Phone, Sparkles, Mountain, Users } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { apiFetch, getImageUrl } from '@/lib/api'
import { formatDate } from '@/lib/format'

interface Lager {
  id: string
  jahr: number
  datumVon: string
  datumBis: string
  beschreibung?: string
  istAktuell: boolean
  immichAlbumUrl?: string
}

interface Settings {
  heroImageUrl?: string
}

const activities = [
  'Skifahren',
  'Snowboarden',
  'Schneeschuhlaufen',
  'Fackelabfahrt',
  'Skirennen',
  'Iglubauen',
]

export default function HomePage() {
  useDocumentTitle('Fit & Fun Familien Lager')

  const [lager, setLager] = useState<Lager | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  const [activityVisible, setActivityVisible] = useState(true)

  useEffect(() => {
    apiFetch<Lager>('/api/public/lager/aktuell')
      .then(setLager)
      .catch(() => {})
    apiFetch<Settings>('/api/public/settings')
      .then(setSettings)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActivityVisible(false)
      setTimeout(() => {
        setCurrentActivityIndex((prev) => (prev + 1) % activities.length)
        setActivityVisible(true)
      }, 300)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const heroImageUrl = settings?.heroImageUrl ? getImageUrl(settings.heroImageUrl) : ''

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center gradient-animated overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating Shapes */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float" />
          <div
            className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: '-3s' }}
          />
          <div
            className="absolute top-1/2 left-1/3 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: '-5s' }}
          />

          {/* Grid Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "url('data:image/svg+xml,%3Csvg width=%2760%27 height=%2760%27 viewBox=%270 0 60 60%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Cg fill=%27%23ffffff%27 fill-opacity=%271%27%3E%3Cpath d=%27M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
            }}
          />
        </div>

        {/* Background Image */}
        {heroImageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
            style={{ backgroundImage: `url(${heroImageUrl})` }}
          />
        )}

        {/* Main Content */}
        <div className="relative z-10 text-center px-4 py-16 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Seit 2007 unvergessliche Winterwochen</span>
          </div>

          {/* Main Title */}
          <h1 className="animate-fade-in-up delay-100 text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight">
            Fit{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
              &
            </span>{' '}
            Fun
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up delay-200 text-xl md:text-2xl text-white/80 mb-4 font-light">
            Familien Skilager in Brigels, Graubünden
          </p>

          {/* Animated Activity Text */}
          <div className="animate-fade-in-up delay-300 h-8 mb-10">
            <p className="text-lg text-orange-300 font-medium">
              <span
                className="inline-block transition-all duration-300"
                style={{
                  opacity: activityVisible ? 1 : 0,
                  transform: activityVisible ? 'translateY(0)' : 'translateY(10px)',
                }}
              >
                {activities[currentActivityIndex]}
              </span>
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up delay-400 flex flex-col sm:flex-row items-center justify-center gap-4">
            {lager && (
              <Link
                to="/lager"
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transition-all duration-300"
              >
                <span>Lager {lager.jahr}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}

            <Link
              to="/archiv"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white/90 border border-white/20 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 transition-all duration-300"
            >
              <span>Lager Archiv</span>
            </Link>
          </div>

          {/* Date Info */}
          {lager && (
            <div className="animate-fade-in-up delay-500 mt-12 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
              <Calendar className="w-5 h-5 text-orange-400" />
              <span className="text-white/90">
                {formatDate(lager.datumVon)} – {formatDate(lager.datumBis)}
              </span>
            </div>
          )}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Quick Info Cards */}
      <section className="relative -mt-20 z-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Nächstes Lager */}
            <div className="group bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/30">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Nächstes Lager</h3>
                  {lager ? (
                    <p className="text-slate-600 leading-relaxed">
                      {formatDate(lager.datumVon)}
                      <br />
                      <span className="text-slate-400">bis</span> {formatDate(lager.datumBis)}
                    </p>
                  ) : (
                    <p className="text-slate-400">Wird bald bekannt gegeben</p>
                  )}
                </div>
              </div>
            </div>

            {/* Lagerhaus */}
            <Link
              to="/lagerhaus"
              className="group bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 hover:border-primary-200 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start gap-5">
                <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg shadow-primary-500/30">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Lagerhaus</h3>
                  <p className="text-slate-600 mb-3">Crestneder, Brigels</p>
                  <span className="inline-flex items-center gap-1 text-primary-600 font-medium group-hover:gap-2 transition-all">
                    Mehr erfahren
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>

            {/* Kontakt */}
            <Link
              to="/kontakt"
              className="group bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 hover:border-primary-200 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start gap-5">
                <div className="p-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/30">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Kontakt</h3>
                  <p className="text-slate-600 mb-3">Fragen? Schreib uns!</p>
                  <span className="inline-flex items-center gap-1 text-primary-600 font-medium group-hover:gap-2 transition-all">
                    Nachricht senden
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
                <Mountain className="w-4 h-4" />
                <span>Seit 2007</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                Unvergessliche
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800">
                  Winterwochen
                </span>
              </h2>

              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                Das Fit & Fun Familienlager bietet jedes Jahr eine unvergessliche Woche für
                Jugendliche und Familien. Ob auf der Piste, beim Schneeschuhlaufen oder abends beim
                gemütlichen Beisammensein – hier entstehen Freundschaften und Erinnerungen fürs
                Leben.
              </p>

              <div className="flex flex-wrap gap-3">
                {['Skifahren', 'Snowboarden', 'Fackelabfahrt', 'Iglubauen', 'Skirennen', 'Spieleabende'].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="px-4 py-2 bg-slate-100 rounded-full text-slate-700 text-sm font-medium"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 text-white">
                <div className="text-5xl font-bold mb-2">19+</div>
                <div className="text-primary-200">Jahre Erfahrung</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-8 text-white">
                <div className="text-5xl font-bold mb-2">7</div>
                <div className="text-orange-200">Tage Abenteuer</div>
              </div>
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg">
                <div className="text-5xl font-bold text-slate-900 mb-2">
                  <Users className="w-12 h-12 text-primary-600 inline" />
                </div>
                <div className="text-slate-600">Familien & Jugendliche</div>
              </div>
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg">
                <div className="text-5xl font-bold text-slate-900 mb-2">
                  <Mountain className="w-12 h-12 text-primary-600 inline" />
                </div>
                <div className="text-slate-600">Brigels, Graubünden</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Bereit für dein Abenteuer?
          </h2>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
            Informiere dich über das nächste Lager oder stöbere in unseren vergangenen Lagern
            voller Erinnerungen.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/lager"
              className="group inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-slate-800 transition-colors"
            >
              <span>Aktuelles Lager</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/sponsoren"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-white transition-all"
            >
              Unsere Sponsoren
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
