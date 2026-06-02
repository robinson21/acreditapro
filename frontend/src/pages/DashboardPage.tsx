import { useDashboard } from '@/hooks/useApi';
import StatCard from '@/components/ui/StatCard';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl">
      <p className="text-sm font-medium text-slate-200 mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const navigate = useNavigate();

  if (isLoading) return <LoadingState text="Cargando dashboard..." fullScreen />;

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Error al cargar el dashboard'}
        onRetry={() => refetch()}
        fullScreen
      />
    );
  }

  const dashboard = data?.data;
  if (!dashboard) return <LoadingState text="Preparando dashboard..." fullScreen />;

  const statCards = [
    {
      icon: <Building2 className="w-5 h-5" />,
      title: 'Empresas Activas',
      value: dashboard.empresasActivas,
      change: 5,
      color: 'blue' as const,
      onClick: () => navigate('/companies'),
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Trabajadores Acreditados',
      value: dashboard.trabajadoresAcreditados,
      change: 12,
      color: 'emerald' as const,
      onClick: () => navigate('/workers'),
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'Documentos Vigentes',
      value: dashboard.documentosVigentes,
      change: -3,
      color: 'amber' as const,
      onClick: () => navigate('/documents'),
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Cumplimiento Global',
      value: `${dashboard.cumplimientoGlobal}%`,
      change: 2,
      color: 'cyan' as const,
    },
  ];

  const alertIcons: Record<string, React.ReactNode> = {
    VENCIMIENTO: <Clock className="w-4 h-4 text-amber-400" />,
    DOCUMENTO_RECHAZADO: <XCircle className="w-4 h-4 text-red-400" />,
    INCUMPLIMIENTO: <AlertCircle className="w-4 h-4 text-red-400" />,
    SISTEMA: <CheckCircle2 className="w-4 h-4 text-blue-400" />,
  };

  const pieColors = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Título */}
      <div>
        <h2 className="text-2xl font-bold text-white">Panel de Control</h2>
        <p className="text-sm text-slate-500 mt-1">
          Resumen ejecutivo del estado de acreditación
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumplimiento por empresa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <h3 className="text-sm font-semibold text-slate-200 mb-4">
            Cumplimiento por Empresa
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboard.cumplimientoPorEmpresa}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 80, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="empresa"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="porcentaje" radius={[0, 4, 4, 0]} barSize={20}>
                  {dashboard.cumplimientoPorEmpresa.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Tendencia mensual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h3 className="text-sm font-semibold text-slate-200 mb-4">
            Tendencia Mensual
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dashboard.tendenciaMensual}
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="documentos"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="acreditados"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Documentos por estado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h3 className="text-sm font-semibold text-slate-200 mb-4">
            Documentos por Estado
          </h3>
          <div className="h-72 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboard.documentosPorEstado}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="cantidad"
                >
                  {dashboard.documentosPorEstado.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.color || pieColors[idx % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 ml-2">
              {dashboard.documentosPorEstado.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        entry.color || pieColors[idx % pieColors.length],
                    }}
                  />
                  <span className="text-xs text-slate-400 capitalize">
                    {entry.estado.toLowerCase().replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Últimas alertas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Últimas Alertas
            </h3>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Ver todas
            </button>
          </div>
          <div className="space-y-3">
            {dashboard.ultimasAlertas.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No hay alertas recientes
              </p>
            ) : (
              dashboard.ultimasAlertas.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                >
                  <div className="mt-0.5">
                    {alertIcons[alert.tipo] || (
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {alert.titulo}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {alert.mensaje}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-600 whitespace-nowrap">
                    {new Date(alert.createdAt).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
