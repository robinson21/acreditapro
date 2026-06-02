import { useState, type FormEvent } from 'react';
import { useWorkers, useCreateWorker, useUpdateWorker, useCompanies } from '@/hooks/useApi';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import type { Worker, Company } from '@/types';
import { Plus, Pencil, Lock, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';

interface WorkerFormData {
  rut: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string;
  telefono: string;
  cargo: string;
  empresaId: string;
  fechaIngreso: string;
  fechaTermino: string;
}

const emptyForm: WorkerFormData = {
  rut: '',
  nombres: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  email: '',
  telefono: '',
  cargo: '',
  empresaId: '',
  fechaIngreso: '',
  fechaTermino: '',
};

export default function WorkersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState<string>('');
  const { data, isLoading, isError, error, refetch } = useWorkers(filterCompany || undefined, page);
  const { data: companiesData } = useCompanies(1, 100);
  const createWorker = useCreateWorker();
  const updateWorker = useUpdateWorker();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState<WorkerFormData>(emptyForm);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<Worker | null>(null);

  const workers = data?.data ?? [];
  const companies = (companiesData?.data ?? []) as Company[];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const filteredWorkers = search
    ? workers.filter(
        (w) =>
          `${w.nombres} ${w.apellidoPaterno}`.toLowerCase().includes(search.toLowerCase()) ||
          w.rut.includes(search)
      )
    : workers;

  const openCreateModal = () => {
    setEditingWorker(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      rut: worker.rut,
      nombres: worker.nombres,
      apellidoPaterno: worker.apellidoPaterno,
      apellidoMaterno: worker.apellidoMaterno,
      email: worker.email || '',
      telefono: worker.telefono || '',
      cargo: worker.cargo,
      empresaId: worker.empresaId,
      fechaIngreso: worker.fechaIngreso ? worker.fechaIngreso.split('T')[0] : '',
      fechaTermino: worker.fechaTermino ? worker.fechaTermino.split('T')[0] : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingWorker) {
        await updateWorker.mutateAsync({ id: editingWorker.id, ...formData });
        toast.success('Trabajador actualizado exitosamente');
      } else {
        await createWorker.mutateAsync(formData);
        toast.success('Trabajador creado exitosamente');
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Error al guardar el trabajador';
      toast.error(msg);
    }
  };

  const handleBlock = async () => {
    if (!blockTarget) return;
    try {
      await updateWorker.mutateAsync({
        id: blockTarget.id,
        estado: blockTarget.estado === 'ACTIVO' ? 'BLOQUEADO' : 'ACTIVO' as const,
      });
      toast.success(
        blockTarget.estado === 'ACTIVO'
          ? 'Trabajador bloqueado'
          : 'Trabajador desbloqueado'
      );
      setConfirmOpen(false);
      setBlockTarget(null);
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const columns: Column<Worker>[] = [
    {
      header: 'Nombre',
      accessor: (row) => `${row.nombres} ${row.apellidoPaterno} ${row.apellidoMaterno}`,
      sortable: true,
      cell: (_, row) => (
        <span className="font-medium text-slate-200">
          {row.nombres} {row.apellidoPaterno}
        </span>
      ),
    },
    {
      header: 'RUT',
      accessor: 'rut',
      sortable: true,
      width: '140px',
    },
    {
      header: 'Cargo',
      accessor: 'cargo',
      sortable: true,
    },
    {
      header: 'Empresa',
      accessor: 'empresaId',
      sortable: false,
      cell: (_, row) => (
        <span className="text-slate-300">{row.empresa?.razonSocial || '—'}</span>
      ),
    },
    {
      header: 'Acreditado',
      accessor: 'acreditado',
      width: '120px',
      cell: (_, row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            row.acreditado
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${row.acreditado ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {row.acreditado ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessor: 'estado',
      sortable: true,
      width: '120px',
      cell: (_, row) => <StatusBadge estado={row.estado} />,
    },
    {
      header: 'Acciones',
      accessor: 'id',
      width: '120px',
      cell: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEditModal(row)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setBlockTarget(row);
              setConfirmOpen(true);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
            title={row.estado === 'ACTIVO' ? 'Bloquear' : 'Desbloquear'}
          >
            {row.estado === 'ACTIVO' ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Trabajadores</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona los trabajadores de las empresas contratistas
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          Nuevo Trabajador
        </button>
      </div>

      <div className="card p-5">
        <DataTable
          columns={columns}
          data={filteredWorkers}
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
          searchPlaceholder="Buscar por nombre o RUT..."
          emptyTitle="No hay trabajadores registrados"
          emptyDescription="Los trabajadores aparecerán aquí una vez que sean registrados."
          emptyAction={
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar Trabajador
            </button>
          }
          filters={
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300"
            >
              <option value="">Todas las empresas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.razonSocial}</option>
              ))}
            </select>
          }
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingWorker ? 'Editar Trabajador' : 'Nuevo Trabajador'}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={createWorker.isPending || updateWorker.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {createWorker.isPending || updateWorker.isPending
                ? 'Guardando...'
                : editingWorker
                ? 'Actualizar'
                : 'Crear Trabajador'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">RUT *</label>
              <input type="text" value={formData.rut} onChange={(e) => setFormData({ ...formData, rut: e.target.value })} placeholder="XX.XXX.XXX-X" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nombres *</label>
              <input type="text" value={formData.nombres} onChange={(e) => setFormData({ ...formData, nombres: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Apellido Paterno *</label>
              <input type="text" value={formData.apellidoPaterno} onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Apellido Materno</label>
              <input type="text" value={formData.apellidoMaterno} onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Teléfono</label>
              <input type="text" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Cargo *</label>
              <input type="text" value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Empresa *</label>
              <select value={formData.empresaId} onChange={(e) => setFormData({ ...formData, empresaId: e.target.value })} required>
                <option value="">Seleccionar empresa...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.razonSocial}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fecha Ingreso</label>
              <input type="date" value={formData.fechaIngreso} onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fecha Término</label>
              <input type="date" value={formData.fechaTermino} onChange={(e) => setFormData({ ...formData, fechaTermino: e.target.value })} />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={handleBlock}
        onCancel={() => { setConfirmOpen(false); setBlockTarget(null); }}
        title={blockTarget?.estado === 'ACTIVO' ? 'Bloquear Trabajador' : 'Desbloquear Trabajador'}
        message={
          blockTarget?.estado === 'ACTIVO'
            ? `¿Estás seguro de bloquear a "${blockTarget?.nombres} ${blockTarget?.apellidoPaterno}"?`
            : `¿Estás seguro de desbloquear a "${blockTarget?.nombres} ${blockTarget?.apellidoPaterno}"?`
        }
        confirmText={blockTarget?.estado === 'ACTIVO' ? 'Bloquear' : 'Desbloquear'}
        variant="danger"
        isLoading={updateWorker.isPending}
      />
    </motion.div>
  );
}
