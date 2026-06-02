import { useState } from 'react';
import { useCompanies, useDashboard } from '@/hooks/useApi';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import {
  FileText,
  Download,
  BarChart3,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Company } from '@/types';

export default function ReportsPage() {
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedProyecto, setSelectedProyecto] = useState('');
  const [selectedContrato, setSelectedContrato] = useState('');
  const [generating, setGenerating] = useState<'pdf' | 'excel' | null>(null);

  const { data: companiesData } = useCompanies(1, 100);
  const { data: dashboardData, isLoading, isError, error, refetch } = useDashboard();

  const companies = (companiesData?.data ?? []) as Company[];
  const dashboard = dashboardData?.data;

  const handleGeneratePDF = async () => {
    setGenerating('pdf');
    // Simulación de generación
    await new Promise((r) => setTimeout(r, 2000));
    setGenerating(null);
  };

  const handleGenerateExcel = async () => {
    setGenerating('excel');
    await new Promise((r) => setTimeout(r, 2000));
    setGenerating(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Informes</h2>
        <p className="text-sm text-slate-500 mt-1">
          Genera reportes de acreditación y cumplimiento
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de filtros */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Filtros del Informe
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Empresa
                </label>
                <select
                  value={selectedEmpresa}
                  onChange={(e) => setSelectedEmpresa(e.target.value)}
                  className="w-full text-sm"
                >
                  <option value="">Todas las empresas</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.razonSocial}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Proyecto
                </label>
                <select
                  value={selectedProyecto}
                  onChange={(e) => setSelectedProyecto(e.target.value)}
                  className="w-full text-sm"
                >
                  <option value="">Todos los proyectos</option>
                  <option value="1">Proyecto Demo 1</option>
                  <option value="2">Proyecto Demo 2</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Contrato
                </label>
                <select
                  value={selectedContrato}
                  onChange={(e) => setSelectedContrato(e.target.value)}
                  className="w-full text-sm"
                >
                  <option value="">Todos los contratos</option>
                  <option value="1">CONT-001</option>
                  <option value="2">CONT-002</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-3">
              <button
                onClick={handleGeneratePDF}
                disabled={generating !== null}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {generating === 'pdf' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Generar PDF
              </button>
              <button
                onClick={handleGenerateExcel}
                disabled={generating !== null}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {generating === 'excel' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                Exportar Excel
              </button>
            </div>
          </div>
        </div>

        {/* Preview del reporte */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <LoadingState text="Cargando indicadores..." />
          ) : isError ? (
            <ErrorState
              message={error instanceof Error ? error.message : 'Error al cargar indicadores'}
              onRetry={() => refetch()}
            />
          ) : (
            <>
              {/* Indicadores principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Cumplimiento Global', value: `${dashboard?.cumplimientoGlobal || 0}%`, color: 'from-blue-600/20 to-blue-600/5 border-blue-500/20', icon: <BarChart3 className="w-5 h-5 text-blue-400" /> },
                  { label: 'Empresas Activas', value: dashboard?.empresasActivas || 0, color: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20', icon: <FileText className="w-5 h-5 text-emerald-400" /> },
                  { label: 'Trabajadores Acreditados', value: dashboard?.trabajadoresAcreditados || 0, color: 'from-purple-600/20 to-purple-600/5 border-purple-500/20', icon: <FileText className="w-5 h-5 text-purple-400" /> },
                  { label: 'Documentos Vigentes', value: dashboard?.documentosVigentes || 0, color: 'from-amber-600/20 to-amber-600/5 border-amber-500/20', icon: <FileText className="w-5 h-5 text-amber-400" /> },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-4 bg-gradient-to-br ${item.color}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {item.icon}
                      <span className="text-xs text-slate-400">{item.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Tabla de cumplimiento por empresa */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-slate-200 mb-4">
                  Cumplimiento por Empresa
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">Empresa</th>
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">% Cumplimiento</th>
                        <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {dashboard?.cumplimientoPorEmpresa?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 text-sm text-slate-200">{item.empresa}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${item.porcentaje}%`,
                                    backgroundColor: item.color || '#3b82f6',
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium text-slate-300 min-w-[40px]">
                                {item.porcentaje}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.porcentaje >= 80
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : item.porcentaje >= 50
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                item.porcentaje >= 80 ? 'bg-emerald-400' : item.porcentaje >= 50 ? 'bg-amber-400' : 'bg-red-400'
                              }`} />
                              {item.porcentaje >= 80 ? 'Cumple' : item.porcentaje >= 50 ? 'En Riesgo' : 'Incumple'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botones de acción inferiores */}
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={handleGeneratePDF}
                  disabled={generating !== null}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                <button
                  onClick={handleGeneratePDF}
                  disabled={generating !== null}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
