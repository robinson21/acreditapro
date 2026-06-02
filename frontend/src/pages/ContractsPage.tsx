import { useState } from 'react';
import { useContracts } from '@/hooks/useApi';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FileSignature, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Contract } from '@/types';

const contractTypeLabels: Record<string, string> = {
  SERVICIO: 'Servicio',
  SUMINISTRO: 'Suministro',
  OBRA: 'Obra',
  ASESORIA: 'Asesoría',
  OTRO: 'Otro',
};

export default function ContractsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error, refetch } = useContracts(page);

  const contracts = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const filtered = search
    ? contracts.filter(
        (c) =>
          c.numero.toLowerCase().includes(search.toLowerCase()) ||
          c.empresa?.razonSocial?.toLowerCase().includes(search.toLowerCase())
      )
    : contracts;

  const columns: Column<Contract>[] = [
    {
      header: 'N° Contrato',
      accessor: 'numero',
      sortable: true,
      cell: (_, row) => (
        <div className="flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span className="font-medium text-slate-200">{row.numero}</span>
        </div>
      ),
    },
    {
      header: 'Empresa',
      accessor: 'empresaId',
      cell: (_, row) => row.empresa?.razonSocial || '—',
    },
    {
      header: 'Proyecto',
      accessor: 'proyectoId',
      cell: (_, row) => row.proyecto?.nombre || '—',
    },
    {
      header: 'Tipo',
      accessor: 'tipo',
      sortable: true,
      cell: (value) => contractTypeLabels[value as string] || String(value),
    },
    {
      header: 'Monto',
      accessor: 'monto',
      sortable: true,
      cell: (_, row) => formatCurrency(row.monto, row.moneda),
    },
    {
      header: 'Inicio',
      accessor: 'fechaInicio',
      sortable: true,
      cell: (value) => formatDate(value as string),
    },
    {
      header: 'Término',
      accessor: 'fechaTermino',
      sortable: true,
      cell: (value) => formatDate(value as string),
    },
    {
      header: 'Estado',
      accessor: 'estado',
      sortable: true,
      width: '140px',
      cell: (_, row) => <StatusBadge estado={row.estado} />,
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
          <h2 className="text-2xl font-bold text-white">Contratos</h2>
          <p className="text-sm text-slate-500 mt-1">Gestión de contratos con empresas contratistas</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4" />
          Nuevo Contrato
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
          searchPlaceholder="Buscar contratos..."
          emptyTitle="No hay contratos registrados"
          emptyDescription="Los contratos aparecerán aquí una vez que sean creados."
        />
      </div>
    </motion.div>
  );
}
