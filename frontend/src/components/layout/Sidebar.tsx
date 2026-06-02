import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useUnreadAlertsCount } from '@/hooks/useApi';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  FolderKanban,
  FileSignature,
  Bell,
  BarChart3,
  Bot,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const { data: unreadData } = useUnreadAlertsCount();

  const unreadCount = unreadData?.data?.count ?? 0;

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Empresas', path: '/companies', icon: <Building2 className="w-5 h-5" /> },
    { label: 'Trabajadores', path: '/workers', icon: <Users className="w-5 h-5" /> },
    { label: 'Documentos', path: '/documents', icon: <FileText className="w-5 h-5" /> },
    { label: 'Proyectos', path: '/projects', icon: <FolderKanban className="w-5 h-5" /> },
    { label: 'Contratos', path: '/contracts', icon: <FileSignature className="w-5 h-5" /> },
    { label: 'Alertas', path: '/alerts', icon: <Bell className="w-5 h-5" />, badge: unreadCount },
    { label: 'Informes', path: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Asistente IA', path: '/chat', icon: <Bot className="w-5 h-5" /> },
    { label: 'Configuración', path: '/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 256 : 72 }}
      className={cn(
        'fixed left-0 top-0 h-full z-30 flex flex-col bg-slate-900/95 border-r border-slate-800 backdrop-blur-xl',
        'transition-[width] duration-300 ease-in-out'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-slate-800',
        sidebarOpen ? 'justify-between' : 'justify-center'
      )}>
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-sm">AP</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">AcreditaPro</h1>
              <p className="text-[10px] text-slate-500 leading-tight">Plataforma de Acreditación</p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-sm">AP</span>
          </div>
        )}
        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'relative flex items-center w-full rounded-xl transition-all duration-200 group',
                sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5',
                active
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              {/* Indicador activo */}
              {active && (
                <motion.div
                  layoutId="activeIndicator"
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full',
                    !sidebarOpen && 'hidden'
                  )}
                />
              )}

              <span className="relative">{item.icon}</span>

              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium truncate flex-1 text-left"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Badge de alertas */}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={cn(
                    'flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold',
                    !sidebarOpen && 'absolute -top-1 -right-1'
                  )}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}

              {/* Tooltip en modo colapsado */}
              {!sidebarOpen && (
                <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-800 text-slate-200 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Perfil y Cerrar sesión */}
      <div className="border-t border-slate-800 p-3 space-y-1">
        {/* Perfil */}
        {sidebarOpen && user && (
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.nombre.charAt(0)}{user.apellido.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user.nombre} {user.apellido}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Cerrar sesión */}
        <button
          onClick={logout}
          className={cn(
            'flex items-center w-full rounded-xl transition-all duration-200 text-slate-400 hover:text-red-400 hover:bg-red-500/10',
            sidebarOpen ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
          )}
          title={!sidebarOpen ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="w-5 h-5" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium"
              >
                Cerrar sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
