import { useState, type FormEvent } from 'react';
import { useCompanies, useCreateCompany, useUpdateCompany } from '@/hooks/useApi';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import type { Company } from '@/types';
import {
  Plus,
  Pencil,
  Lock,
  Unlock,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CompanyFormData {
  rut: string;
  razonSocial: string;
  nombreFantasia: string;
  giro: string;
  direccion: string;
  comuna: string;
  region: string;
  telefono: string;
  email: string;
  representanteLegal: string;
  rutRepresentante: string;
  industria: string;
}

const emptyForm: CompanyFormData = {
  rut: '',
  razonSocial: '',
  nombreFantasia: '',
  giro: '',
  direccion: '',
  comuna: '',
  region: '',
  telefono: '',
  email: '',
  representanteLegal: '',
  rutRepresentante: '',
  industria: '',
};

export default function CompaniesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error, refetch } = useCompanies(page);
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>(emptyForm);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<Company | null>(null);

  const companies = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const filteredCompanies = search
    ? companies.filter(
        (c) =>
          c.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
          c.rut.includes(search)
      )
    : companies;

  const openCreateModal = () => {
    setEditingCompany(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      rut: company.rut,
      razonSocial: company.razonSocial,
      nombreFantasia: company.nombreFantasia || '',
      giro: company.giro,
      direccion: company.direccion || '',
      comuna: company.comuna || '',
      region: company.region || '',
      telefono: company.telefono || '',
      email: company.email || '',
      representanteLegal: company.representanteLegal || '',
      rutRepresentante: company.rutRepresentante || '',
      industria: company.industria || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await updateCompany.mutateAsync({ id: editingCompany.id, ...formData });
        toast.success('Empresa actualizada exitosamente');
      } else {
        await createCompany.mutateAsync(formData);
        toast.success('Empresa creada exitosamente');
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Error al guardar la empresa';
      toast.error(msg);
    }
  };

  const handleBlock = async () => {
    if (!blockTarget) return;
    try {
      await updateCompany.mutateAsync({
        id: blockTarget.id,
        estado: blockTarget.estado === 'ACTIVO' ? 'BLOQUEADO' : 'ACTIVO',
      });
      toast.success(
        blockTarget.estado === 'ACTIVO'
          ? 'Empresa bloqueada'
          : 'Empresa desbloqueada'
      );
      setConfirmOpen(false);
      setBlockTarget(null);
    } catch (err: unknown) {
      toast.error('Error al cambiar estado');
    }
  };

  const columns: Column<Company>[] = [
    {
      header: 'Razón Social',
      accessor: 'razonSocial',
      sortable: true,
    },
    {
      header: 'RUT',
      accessor: 'rut',
      sortable: true,
      width: '140px',
    },
    {
      header: 'Giro',
      accessor: 'giro',
      sortable: true,
    },
    {
      header: 'Representante',
      accessor: 'representanteLegal',
      cell: (value) => (value as string) || <span className="text-slate-500">—</span>,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Empresas</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona las empresas contratistas registradas en la plataforma
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
        >
          <Plus className="w-4 h-4" />
          Nueva Empresa
        </button>
      </div>

      {/* Tabla */}
      <div className="card p-5">
        <DataTable
          columns={columns}
          data={filteredCompanies}
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
          searchPlaceholder="Buscar por RUT o razón social..."
          emptyTitle="No hay empresas registradas"
          emptyDescription="Comienza agregando la primera empresa contratista."
          emptyAction={
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar Empresa
            </button>
          }
        />
      </div>

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
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
              disabled={createCompany.isPending || updateCompany.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {createCompany.isPending || updateCompany.isPending
                ? 'Guardando...'
                : editingCompany
                ? 'Actualizar'
                : 'Crear Empresa'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                RUT *
              </label>
              <input
                type="text"
                value={formData.rut}
                onChange={(e) =>
                  setFormData({ ...formData, rut: e.target.value })
                }
                placeholder="XX.XXX.XXX-X"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Razón Social *
              </label>
              <input
                type="text"
                value={formData.razonSocial}
                onChange={(e) =>
                  setFormData({ ...formData, razonSocial: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nombre Fantasía
              </label>
              <input
                type="text"
                value={formData.nombreFantasia}
                onChange={(e) =>
                  setFormData({ ...formData, nombreFantasia: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Giro *
              </label>
              <input
                type="text"
                value={formData.giro}
                onChange={(e) =>
                  setFormData({ ...formData, giro: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Industria
              </label>
              <select
                value={formData.industria}
                onChange={(e) =>
                  setFormData({ ...formData, industria: e.target.value })
                }
              >
                <option value="">Seleccionar...</option>
                <option value="CONSTRUCCION">Construcción</option>
                <option value="MINERIA">Minería</option>
                <option value="SALUD">Salud</option>
                <option value="EDUCACION">Educación</option>
                <option value="TRANSPORTE">Transporte</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) =>
                  setFormData({ ...formData, direccion: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Comuna
              </label>
              <input
                type="text"
                value={formData.comuna}
                onChange={(e) =>
                  setFormData({ ...formData, comuna: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Región
              </label>
              <select
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
              >
                <option value="">Seleccionar...</option>
                {['RM - Metropolitana', 'I - Tarapacá', 'II - Antofagasta', 'III - Atacama', 'IV - Coquimbo', 'V - Valparaíso', 'VI - O\'Higgins', 'VII - Maule', 'VIII - Biobío', 'IX - Araucanía', 'X - Los Lagos', 'XI - Aysén', 'XII - Magallanes', 'XIV - Los Ríos', 'XV - Arica'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Representante Legal
              </label>
              <input
                type="text"
                value={formData.representanteLegal}
                onChange={(e) =>
                  setFormData({ ...formData, representanteLegal: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                RUT Representante
              </label>
              <input
                type="text"
                value={formData.rutRepresentante}
                onChange={(e) =>
                  setFormData({ ...formData, rutRepresentante: e.target.value })
                }
                placeholder="XX.XXX.XXX-X"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirmación bloquear */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={handleBlock}
        onCancel={() => {
          setConfirmOpen(false);
          setBlockTarget(null);
        }}
        title={blockTarget?.estado === 'ACTIVO' ? 'Bloquear Empresa' : 'Desbloquear Empresa'}
        message={
          blockTarget?.estado === 'ACTIVO'
            ? `¿Estás seguro de bloquear a "${blockTarget?.razonSocial}"? Los trabajadores asociados no podrán operar.`
            : `¿Estás seguro de desbloquear a "${blockTarget?.razonSocial}"?`
        }
        confirmText={blockTarget?.estado === 'ACTIVO' ? 'Bloquear' : 'Desbloquear'}
        variant="danger"
        isLoading={updateCompany.isPending}
      />
    </motion.div>
  );
}
