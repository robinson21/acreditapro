import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useUnreadAlertsCount } from '@/hooks/useApi';
import {
  Menu,
  Bell,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/companies': 'Empresas',
  '/workers': 'Trabajadores',
  '/documents': 'Documentos',
  '/projects': 'Proyectos',
  '/contracts': 'Contratos',
  '/alerts': 'Alertas',
  '/reports': 'Informes',
  '/chat': 'Asistente IA',
  '/settings': 'Configuración',
};

export default function Header() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const { data: unreadData } = useUnreadAlertsCount();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = unreadData?.data?.count ?? 0;

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Determinar título de página
  const currentPath = Object.keys(pageTitles).find(
    (path) =>
      location.pathname === path || location.pathname.startsWith(path + '/')
  );
  const pageTitle = currentPath
    ? pageTitles[currentPath]
    : location.pathname.includes('/documents/')
    ? 'Revisión de Documento'
    : 'AcreditaPro';

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-20 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800',
        'transition-all duration-300 ease-in-out',
        sidebarOpen ? 'left-64' : 'left-[72px]'
      )}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Izquierda */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">{pageTitle}</h1>
            <p className="text-xs text-slate-500">
              {new Date().toLocaleDateString('es-CL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-2">
          {/* Notificaciones */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-3 border-b border-slate-800">
                    <p className="text-sm font-semibold text-slate-200">Notificaciones</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {unreadCount === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        No hay notificaciones nuevas
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-slate-400">
                        {unreadCount} notificaciones sin leer
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t border-slate-800">
                    <button className="w-full py-2 text-center text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      Ver todas las notificaciones
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Perfil */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {user ? `${user.nombre.charAt(0)}${user.apellido.charAt(0)}` : '?'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-200 leading-tight">
                  {user ? `${user.nombre} ${user.apellido}` : 'Usuario'}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">{user?.rol?.replace('_', ' ')}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-3 border-b border-slate-800">
                    <p className="text-sm font-medium text-slate-200">
                      {user?.nombre} {user?.apellido}
                    </p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        window.location.href = '/settings';
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Configuración
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
