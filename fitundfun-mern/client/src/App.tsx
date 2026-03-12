import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import PublicLayout from '@/components/PublicLayout'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import HomePage from '@/pages/public/HomePage'
import LagerPage from '@/pages/public/LagerPage'
import ArchivPage from '@/pages/public/ArchivPage'
import ArchivDetailPage from '@/pages/public/ArchivDetailPage'
import LagerhausPage from '@/pages/public/LagerhausPage'
import SponsorenPage from '@/pages/public/SponsorenPage'
import KontaktPage from '@/pages/public/KontaktPage'
import LoginPage from '@/pages/admin/LoginPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import LagerManagePage from '@/pages/admin/LagerManagePage'
import DownloadsManagePage from '@/pages/admin/DownloadsManagePage'
import LagerhausManagePage from '@/pages/admin/LagerhausManagePage'
import SponsorenManagePage from '@/pages/admin/SponsorenManagePage'
import NachrichtenPage from '@/pages/admin/NachrichtenPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import BackupPage from '@/pages/admin/BackupPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/lager" element={<LagerPage />} />
            <Route path="/archiv" element={<ArchivPage />} />
            <Route path="/archiv/:jahr" element={<ArchivDetailPage />} />
            <Route path="/lagerhaus" element={<LagerhausPage />} />
            <Route path="/sponsoren" element={<SponsorenPage />} />
            <Route path="/kontakt" element={<KontaktPage />} />
          </Route>

          {/* Admin login */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Admin routes (protected) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/lager" element={<LagerManagePage />} />
              <Route path="/admin/downloads" element={<DownloadsManagePage />} />
              <Route path="/admin/lagerhaus" element={<LagerhausManagePage />} />
              <Route path="/admin/sponsoren" element={<SponsorenManagePage />} />
              <Route path="/admin/nachrichten" element={<NachrichtenPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
              <Route path="/admin/backup" element={<BackupPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
