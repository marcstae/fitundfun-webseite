import { Outlet } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
