import { useState } from 'react';
import { useProjects } from '@/hooks/useApi';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';
import { FolderKanban, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Project } from '@/types';

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error, refetch } = useProjects(page);

  const projects = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const filtered = search
    ? projects.filter(
        (p) =>
          p.nombre.toLowerCase().includes(search.toLowerCase()) ||
          p.cliente.toLowerCase().includes(search.toLowerCase())
      )
    : projects;

  const columns: Column<Project>[] = [
    {
      header: 'Nombre',
      accessor: 'nombre',
      sortable: true,
      cell: (_, row) => (
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span className="font-medium text-slate-200">{row.nombre}</span>
        </div>
      ),
    },
    {
      header: 'Cliente',
      accessor: 'cliente',
      sortable: true,
    },
    {
      header: 'Código',
      accessor: 'codigo',
      cell: (value) => (value as string) || '—',
    },
    {
      header: 'Fecha Inicio',
      accessor: 'fechaInicio',
      sortable: true,
      cell: (value) => formatDate(value as string),
    },
    {
      header: 'Fecha Término',
      accessor: 'fechaTermino',
      sortable: true,
      cell: (value) => (value ? formatDate(value as string) : '—'),
    },
    {
      header: 'Estado',
      accessor: 'estado',
      sortable: true,
      width: '140px',
      cell: (_, row) => <StatusBadge estado={row.estado} />,
    },
    {
      header: 'Presupuesto',
      accessor: 'presupuesto',
      sortable: true,
      cell: (value) =>
        value != null
          ? new Intl.NumberFormat('es-CL', {
              style: 'currency',
              currency: 'CLP',
              minimumFractionDigits: 0,
            }).format(value as number)
          : '—',
    },
    {
      header: 'Acciones',
      accessor: 'id',
      width: '100px',
      cell: () => (
        <button className="px-3 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors">
          Ver detalle
        </button>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Proyectos</h2>
          <p className="text-sm text-slate-500 mt-1">Gestión de proyectos y obras</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4" />
          Nuevo Proyecto
        </button>
      </div>

      <div className="card p-5">
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          searchValue={search}
          onSearch={setSearch}
          searchPlaceholder="Buscar proyectos..."
          emptyTitle="No hay proyectos registrados"
          emptyDescription="Crea el primer proyecto para comenzar."
        />
      </div>
    </motion.div>
  );
}
