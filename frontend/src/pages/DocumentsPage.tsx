import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments, useUploadDocument, useCompanies } from '@/hooks/useApi';
import DataTable, { type Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import FileUpload from '@/components/ui/FileUpload';
import { toast } from 'sonner';
import type { Document, Company } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  Eye,
  Download,
  History,
  FileText,
  Upload,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';

const documentTypeLabels: Record<string, string> = {
  CEDULA_IDENTIDAD: 'Cédula de Identidad',
  CERTIFICADO_NACIMIENTO: 'Cert. de Nacimiento',
  CERTIFICADO_ANTECEDENTES: 'Cert. de Antecedentes',
  CERTIFICADO_AFP: 'Cert. AFP',
  CERTIFICADO_SALUD: 'Cert. de Salud',
  CONTRATO: 'Contrato',
  FINIQUITO: 'Finiquito',
  LIQUIDACION_SUELDO: 'Liquidación de Sueldo',
  CERTIFICADO_CAPACITACION: 'Cert. de Capacitación',
  LICENCIA_CONDUCIR: 'Licencia de Conducir',
  OTRO: 'Otro',
};

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const { data, isLoading, isError, error, refetch } = useDocuments({
    tipo: filterTipo || undefined,
    estado: filterEstado || undefined,
    empresaId: filterEmpresa || undefined,
    page,
  });
  const { data: companiesData } = useCompanies(1, 100);
  const uploadDoc = useUploadDocument();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadMeta, setUploadMeta] = useState({
    tipo: 'OTRO' as string,
    nombre: '',
    descripcion: '',
    empresaId: '',
    trabajadorRut: '',
    fechaEmision: '',
    fechaVencimiento: '',
  });

  const documents = data?.data ?? [];
  const companies = (companiesData?.data ?? []) as Company[];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const filteredDocs = search
    ? documents.filter(
        (d) =>
          d.nombre.toLowerCase().includes(search.toLowerCase()) ||
          d.archivoNombre.toLowerCase().includes(search.toLowerCase())
      )
    : documents;

  const openUploadModal = () => {
    setUploadFiles([]);
    setUploadMeta({
      tipo: 'OTRO',
      nombre: '',
      descripcion: '',
      empresaId: '',
      trabajadorRut: '',
      fechaEmision: '',
      fechaVencimiento: '',
    });
    setUploadModalOpen(true);
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) {
      toast.error('Debes seleccionar al menos un archivo');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', uploadFiles[0]);
      formData.append('tipo', uploadMeta.tipo);
      formData.append('nombre', uploadMeta.nombre);
      if (uploadMeta.descripcion) formData.append('descripcion', uploadMeta.descripcion);
      if (uploadMeta.empresaId) formData.append('empresaId', uploadMeta.empresaId);
      if (uploadMeta.trabajadorRut) formData.append('trabajadorRut', uploadMeta.trabajadorRut);
      if (uploadMeta.fechaEmision) formData.append('fechaEmision', uploadMeta.fechaEmision);
      if (uploadMeta.fechaVencimiento) formData.append('fechaVencimiento', uploadMeta.fechaVencimiento);

      await uploadDoc.mutateAsync(formData);
      toast.success('Documento subido exitosamente');
      setUploadModalOpen(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Error al subir el documento';
      toast.error(msg);
    }
  };

  const columns: Column<Document>[] = [
    {
      header: 'Nombre',
      accessor: 'nombre',
      sortable: true,
      cell: (_, row) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span className="font-medium text-slate-200 truncate max-w-[200px]">
            {row.nombre}
          </span>
        </div>
      ),
    },
    {
      header: 'Tipo',
      accessor: 'tipo',
      sortable: true,
      cell: (value) => documentTypeLabels[value as string] || String(value),
    },
    {
      header: 'Empresa',
      accessor: 'empresaId',
      cell: (_, row) => row.empresa?.razonSocial || '—',
    },
    {
      header: 'Trabajador',
      accessor: 'trabajadorId',
      cell: (_, row) =>
        row.trabajador
          ? `${row.trabajador.nombres} ${row.trabajador.apellidoPaterno}`
          : '—',
    },
    {
      header: 'Emisión',
      accessor: 'fechaEmision',
      sortable: true,
      cell: (value) => (value ? formatDate(value as string) : '—'),
    },
    {
      header: 'Vencimiento',
      accessor: 'fechaVencimiento',
      sortable: true,
      cell: (value) => {
        if (!value) return '—';
        const date = value as string;
        const daysLeft = Math.ceil(
          (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return (
          <span className={`${daysLeft <= 30 && daysLeft > 0 ? 'text-amber-400' : daysLeft <= 0 ? 'text-red-400' : ''}`}>
            {formatDate(date)}
          </span>
        );
      },
    },
    {
      header: 'Acreditación',
      accessor: 'estadoAcreditacion',
      sortable: true,
      width: '140px',
      cell: (_, row) => <StatusBadge estado={row.estadoAcreditacion} />,
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
      width: '160px',
      cell: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/documents/${row.id}/review`)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors"
            title="Revisar"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.open(row.archivoUrl, '_blank')}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors"
            title="Descargar"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-purple-400 transition-colors"
            title="Historial"
          >
            <History className="w-4 h-4" />
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
          <h2 className="text-2xl font-bold text-white">Documentos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestión documental de acreditación de contratistas
          </p>
        </div>
        <button
          onClick={openUploadModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl"
        >
          <Upload className="w-4 h-4" />
          Subir Documento
        </button>
      </div>

      <div className="card p-5">
        <DataTable
          columns={columns}
          data={filteredDocs}
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
          searchPlaceholder="Buscar documentos..."
          emptyTitle="No hay documentos registrados"
          emptyDescription="Sube documentos para comenzar con la acreditación."
          emptyAction={
            <button
              onClick={openUploadModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Subir Documento
            </button>
          }
          filters={
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300"
              >
                <option value="">Todos los tipos</option>
                {Object.entries(documentTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300"
              >
                <option value="">Todos los estados</option>
                <option value="VIGENTE">Vigente</option>
                <option value="POR_VENCER">Por Vencer</option>
                <option value="VENCIDO">Vencido</option>
                <option value="RECHAZADO">Rechazado</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
              <select
                value={filterEmpresa}
                onChange={(e) => setFilterEmpresa(e.target.value)}
                className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300"
              >
                <option value="">Todas las empresas</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.razonSocial}</option>
                ))}
              </select>
            </div>
          }
        />
      </div>

      {/* Modal Subir Documento */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Subir Documento"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={uploadDoc.isPending || uploadFiles.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
            >
              {uploadDoc.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Subir Documento
                </>
              )}
            </button>
          </>
        }
      >
        <form onSubmit={handleUpload} className="space-y-5">
          {/* FileUpload */}
          <FileUpload
            onFilesSelected={(files) => setUploadFiles(files)}
            files={uploadFiles}
            uploading={uploadDoc.isPending}
          />

          <div className="border-t border-slate-800 pt-5">
            <h4 className="text-sm font-semibold text-slate-200 mb-4">Metadatos del documento</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tipo *</label>
                <select value={uploadMeta.tipo} onChange={(e) => setUploadMeta({ ...uploadMeta, tipo: e.target.value })} required>
                  {Object.entries(documentTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre *</label>
                <input type="text" value={uploadMeta.nombre} onChange={(e) => setUploadMeta({ ...uploadMeta, nombre: e.target.value })} required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
                <textarea
                  value={uploadMeta.descripcion}
                  onChange={(e) => setUploadMeta({ ...uploadMeta, descripcion: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Empresa</label>
                <select value={uploadMeta.empresaId} onChange={(e) => setUploadMeta({ ...uploadMeta, empresaId: e.target.value })}>
                  <option value="">Seleccionar empresa...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.razonSocial}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">RUT Trabajador</label>
                <input
                  type="text"
                  value={uploadMeta.trabajadorRut}
                  onChange={(e) => setUploadMeta({ ...uploadMeta, trabajadorRut: e.target.value })}
                  placeholder="XX.XXX.XXX-X"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Fecha Emisión</label>
                <input type="date" value={uploadMeta.fechaEmision} onChange={(e) => setUploadMeta({ ...uploadMeta, fechaEmision: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Fecha Vencimiento</label>
                <input type="date" value={uploadMeta.fechaVencimiento} onChange={(e) => setUploadMeta({ ...uploadMeta, fechaVencimiento: e.target.value })} />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
