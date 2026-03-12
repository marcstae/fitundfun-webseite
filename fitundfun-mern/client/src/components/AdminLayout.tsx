import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutDashboard,
  Mountain,
  FileDown,
  Home,
  Users,
  Mail,
  Settings,
  Database,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const sidebarItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/lager', label: 'Lager', icon: Mountain },
  { to: '/admin/downloads', label: 'Downloads', icon: FileDown },
  { to: '/admin/lagerhaus', label: 'Lagerhaus', icon: Home },
  { to: '/admin/sponsoren', label: 'Sponsoren', icon: Users },
  { to: '/admin/nachrichten', label: 'Nachrichten', icon: Mail },
  { to: '/admin/settings', label: 'Einstellungen', icon: Settings },
  { to: '/admin/backup', label: 'Backup', icon: Database },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
            <span className="text-lg font-bold text-primary-700">Fit &amp; Fun Admin</span>
            <button
              type="button"
              className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-600"
              onClick={closeSidebar}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-slate-600 hover:text-primary-700 hover:bg-slate-50'
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="px-3 py-4 border-t border-slate-200 space-y-1">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-primary-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 flex-shrink-0" />
              Zur Website
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              Abmelden
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b border-slate-200">
          <button
            type="button"
            className="p-2 rounded-md text-slate-600 hover:text-primary-700 hover:bg-slate-100 transition-colors"
            onClick={toggleSidebar}
            aria-label="Sidebar öffnen"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-3 text-lg font-bold text-primary-700">Fit &amp; Fun Admin</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
