import { useState, FormEvent } from 'react'
import { Send, CheckCircle } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { apiFetch } from '@/lib/api'

export default function KontaktPage() {
  useDocumentTitle('Kontakt - Fit & Fun')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [nachricht, setNachricht] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const submitForm = async (e: FormEvent) => {
    e.preventDefault()

    if (!name || !email || !nachricht) {
      setError('Bitte fülle alle Felder aus.')
      return
    }

    if (nachricht.length < 10) {
      setError('Die Nachricht muss mindestens 10 Zeichen haben.')
      return
    }

    if (nachricht.length > 5000) {
      setError('Die Nachricht darf maximal 5000 Zeichen haben.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, nachricht }),
      })

      setIsSubmitted(true)
      setName('')
      setEmail('')
      setNachricht('')
    } catch (err: unknown) {
      const e = err as Error & { status?: number; data?: { message?: string; errors?: { message: string }[] } }
      if (e.status === 429) {
        setError(e.data?.message || 'Zu viele Anfragen. Bitte warte etwas.')
      } else if (e.status === 400) {
        const errors = e.data?.errors
        if (errors?.length) {
          setError(errors.map((err) => err.message).join(', '))
        } else {
          setError(e.data?.message || 'Ungültige Eingabe.')
        }
      } else {
        setError('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Kontakt</h1>
          <p className="text-lg text-slate-600">
            Hast du Fragen zum Lager? Schreib uns eine Nachricht!
          </p>
        </div>

        {/* Success Message */}
        {isSubmitted ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-800 mb-2">Nachricht gesendet!</h2>
            <p className="text-green-700">
              Vielen Dank für deine Nachricht. Wir melden uns bald bei dir.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="mt-4 text-green-600 hover:text-green-700 font-medium"
            >
              Weitere Nachricht senden
            </button>
          </div>
        ) : (
          /* Contact Form */
          <form
            onSubmit={submitForm}
            className="bg-white rounded-xl p-8 shadow-sm border border-slate-200"
          >
            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
            )}

            {/* Name */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                placeholder="Dein Name"
              />
            </div>

            {/* Email */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                E-Mail *
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                placeholder="deine@email.ch"
              />
            </div>

            {/* Message */}
            <div className="mb-6">
              <label
                htmlFor="nachricht"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Nachricht *
              </label>
              <textarea
                id="nachricht"
                required
                rows={5}
                value={nachricht}
                onChange={(e) => setNachricht(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
                placeholder="Deine Nachricht..."
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
              {isSubmitting ? 'Wird gesendet...' : 'Nachricht senden'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
