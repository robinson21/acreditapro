import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { AnimatePresence, motion } from 'framer-motion';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Pages
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import CompaniesPage from '@/pages/CompaniesPage';
import WorkersPage from '@/pages/WorkersPage';
import DocumentsPage from '@/pages/DocumentsPage';
import DocumentReviewPage from '@/pages/DocumentReviewPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ContractsPage from '@/pages/ContractsPage';
import ReportsPage from '@/pages/ReportsPage';
import ChatPage from '@/pages/ChatPage';
import SettingsPage from '@/pages/SettingsPage';

// Componente de ruta protegida
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-700 rounded-full">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin -mt-1 -ml-1" />
          </div>
          <p className="text-sm text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Componente para transición de páginas
function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { setCurrentPage } = useUIStore();

  // Sincronizar página actual con el store de UI
  useEffect(() => {
    const path = location.pathname;
    const page = path.split('/')[1] || 'dashboard';
    setCurrentPage(page);
  }, [location.pathname, setCurrentPage]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Login - sin layout */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          }
        />

        {/* Layout principal con sidebar y header */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Redirección de / a /dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard */}
          <Route
            path="dashboard"
            element={
              <PageTransition>
                <DashboardPage />
              </PageTransition>
            }
          />

          {/* Empresas */}
          <Route
            path="companies"
            element={
              <PageTransition>
                <CompaniesPage />
              </PageTransition>
            }
          />

          {/* Trabajadores */}
          <Route
            path="workers"
            element={
              <PageTransition>
                <WorkersPage />
              </PageTransition>
            }
          />

          {/* Documentos */}
          <Route
            path="documents"
            element={
              <PageTransition>
                <DocumentsPage />
              </PageTransition>
            }
          />

          {/* Revisión de documento */}
          <Route
            path="documents/:id/review"
            element={
              <PageTransition>
                <DocumentReviewPage />
              </PageTransition>
            }
          />

          {/* Proyectos */}
          <Route
            path="projects"
            element={
              <PageTransition>
                <ProjectsPage />
              </PageTransition>
            }
          />

          {/* Contratos */}
          <Route
            path="contracts"
            element={
              <PageTransition>
                <ContractsPage />
              </PageTransition>
            }
          />

          {/* Informes */}
          <Route
            path="reports"
            element={
              <PageTransition>
                <ReportsPage />
              </PageTransition>
            }
          />

          {/* Asistente IA */}
          <Route
            path="chat"
            element={
              <PageTransition>
                <ChatPage />
              </PageTransition>
            }
          />

          {/* Configuración */}
          <Route
            path="settings"
            element={
              <PageTransition>
                <SettingsPage />
              </PageTransition>
            }
          />

          {/* Ruta no encontrada - redirigir a dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Ruta raíz sin auth */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
