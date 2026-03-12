import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tent, Mail, BarChart3 } from 'lucide-react'

interface Lager {
  _id: string
  titel: string
  jahr: number
  istAktuell: boolean
}

interface Nachricht {
  _id: string
  gelesen: boolean
}

export default function DashboardPage() {
  useDocumentTitle('Dashboard')

  const [lagerList, setLagerList] = useState<Lager[]>([])
  const [nachrichten, setNachrichten] = useState<Nachricht[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch<Lager[]>('/api/admin/lager'),
      apiFetch<Nachricht[]>('/api/admin/nachrichten'),
    ])
      .then(([lager, msgs]) => {
        setLagerList(lager)
        setNachrichten(msgs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const aktuellesLager = lagerList.find((l) => l.istAktuell)
  const unreadCount = nachrichten.filter((n) => !n.gelesen).length
  const totalLager = lagerList.length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Laden...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Aktuelles Lager
            </CardTitle>
            <Tent className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {aktuellesLager ? aktuellesLager.titel : 'Keines gesetzt'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Ungelesene Nachrichten
            </CardTitle>
            <Mail className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{unreadCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Lager gesamt
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalLager}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link to="/admin/lager">
          <Button>Lager verwalten</Button>
        </Link>
        <Link to="/admin/nachrichten">
          <Button variant="outline">Nachrichten ansehen</Button>
        </Link>
      </div>
    </div>
  )
}
