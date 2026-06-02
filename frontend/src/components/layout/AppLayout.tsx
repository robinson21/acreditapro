import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />

      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          sidebarOpen ? 'ml-64' : 'ml-[72px]'
        )}
      >
        <Header />

        <main className="pt-16 min-h-screen">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
