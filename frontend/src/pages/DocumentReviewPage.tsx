import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocument, useReviewDocument } from '@/hooks/useApi';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import { toast } from 'sonner';
import { formatDate, formatFileSize } from '@/lib/utils';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  FileText,
  User,
  Building2,
  Calendar,
  Clock,
  Brain,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';

const documentTypeLabels: Record<string, string> = {
  CEDULA_IDENTIDAD: 'Cédula de Identidad',
  CERTIFICADO_NACIMIENTO: 'Certificado de Nacimiento',
  CERTIFICADO_ANTECEDENTES: 'Certificado de Antecedentes',
  CERTIFICADO_AFP: 'Certificado AFP',
  CERTIFICADO_SALUD: 'Certificado de Salud',
  CONTRATO: 'Contrato',
  FINIQUITO: 'Finiquito',
  LIQUIDACION_SUELDO: 'Liquidación de Sueldo',
  CERTIFICADO_CAPACITACION: 'Certificado de Capacitación',
  LICENCIA_CONDUCIR: 'Licencia de Conducir',
  OTRO: 'Otro',
};

export default function DocumentReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useDocument(id || '');
  const reviewDoc = useReviewDocument();

  const [observaciones, setObservaciones] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const document = data?.data;

  useEffect(() => {
    if (document?.observacionesIA) {
      setObservaciones(document.observacionesIA);
    }
  }, [document]);

  const handleApprove = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await reviewDoc.mutateAsync({
        id,
        estadoAcreditacion: 'ACREDITADO',
        observaciones,
      });
      toast.success('Documento acreditado exitosamente');
      navigate('/documents');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Error al aprobar el documento';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    if (!observaciones.trim()) {
      toast.error('Debes agregar observaciones para rechazar el documento');
      return;
    }
    setIsProcessing(true);
    try {
      await reviewDoc.mutateAsync({
        id,
        estadoAcreditacion: 'RECHAZADO',
        observaciones,
      });
      toast.success('Documento rechazado');
      navigate('/documents');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Error al rechazar el documento';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <LoadingState text="Cargando documento..." fullScreen />;

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Error al cargar el documento'}
        onRetry={() => refetch()}
        fullScreen
      />
    );
  }

  if (!document) return <LoadingState text="Documento no encontrado" fullScreen />;

  const isPdf = document.archivoMimeType === 'application/pdf';
  const isImage = document.archivoMimeType.startsWith('image/');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/documents')}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Revisión de Documento</h2>
            <p className="text-sm text-slate-500 mt-0.5">{document.nombre}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge estado={document.estadoAcreditacion} />
          <StatusBadge estado={document.estado} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview del documento */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">
                  Previsualización
                </span>
              </div>
              <a
                href={document.archivoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar
              </a>
            </div>
            <div className="document-preview h-[550px] m-4">
              {isPdf ? (
                <iframe
                  src={`${document.archivoUrl}#view=FitH`}
                  className="w-full h-full rounded-lg"
                  title="Vista previa del documento"
                />
              ) : isImage ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-950 rounded-lg">
                  <img
                    src={document.archivoUrl}
                    alt={document.nombre}
                    className="max-w-full max-h-full object-contain p-4"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                  <FileText className="w-16 h-16 mb-4" />
                  <p className="text-sm">Vista previa no disponible</p>
                  <a
                    href={document.archivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    Descargar archivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel derecho - Metadata y acciones */}
        <div className="space-y-4">
          {/* Metadatos */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Información del Documento
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Tipo</p>
                  <p className="text-sm text-slate-200">
                    {documentTypeLabels[document.tipo] || document.tipo}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Empresa</p>
                  <p className="text-sm text-slate-200">
                    {document.empresa?.razonSocial || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Trabajador</p>
                  <p className="text-sm text-slate-200">
                    {document.trabajador
                      ? `${document.trabajador.nombres} ${document.trabajador.apellidoPaterno}`
                      : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Emisión</p>
                  <p className="text-sm text-slate-200">
                    {document.fechaEmision ? formatDate(document.fechaEmision) : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Vencimiento</p>
                  <p className="text-sm text-slate-200">
                    {document.fechaVencimiento ? formatDate(document.fechaVencimiento) : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Archivo</p>
                  <p className="text-sm text-slate-200 truncate">
                    {document.archivoNombre} ({formatFileSize(document.archivoTamanio)})
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-slate-500 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Versión</p>
                  <p className="text-sm text-slate-200">v{document.version}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Análisis IA */}
          {document.observacionesIA && (
            <div className="card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Análisis IA
                </h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                {document.observacionesIA}
              </p>
              {document.metadataIA && (
                <div className="mt-3 space-y-1">
                  {Object.entries(document.metadataIA).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-slate-500 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-300">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Acciones de revisión */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Acciones de Revisión
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Agrega observaciones para la acreditación o el rechazo..."
                rows={4}
                className="w-full resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Acreditar
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Rechazar
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
