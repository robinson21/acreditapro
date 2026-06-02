export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'VIEWER';
  avatar?: string;
  activo: boolean;
  ultimoAcceso?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  rut: string;
  razonSocial: string;
  nombreFantasia?: string;
  giro: string;
  direccion?: string;
  comuna?: string;
  region?: string;
  telefono?: string;
  email?: string;
  representanteLegal?: string;
  rutRepresentante?: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  industria?: string;
  cantidadTrabajadores?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Worker {
  id: string;
  rut: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email?: string;
  telefono?: string;
  cargo: string;
  empresaId: string;
  empresa?: Company;
  estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  fechaIngreso?: string;
  fechaTermino?: string;
  acreditado: boolean;
  documentos?: Document[];
  createdAt: string;
  updatedAt: string;
}

export type DocumentType =
  | 'CEDULA_IDENTIDAD'
  | 'CERTIFICADO_NACIMIENTO'
  | 'CERTIFICADO_ANTECEDENTES'
  | 'CERTIFICADO_AFP'
  | 'CERTIFICADO_SALUD'
  | 'CONTRATO'
  | 'FINIQUITO'
  | 'LIQUIDACION_SUELDO'
  | 'CERTIFICADO_CAPACITACION'
  | 'LICENCIA_CONDUCIR'
  | 'OTRO';

export type DocumentStatus =
  | 'PENDIENTE'
  | 'VIGENTE'
  | 'POR_VENCER'
  | 'VENCIDO'
  | 'RECHAZADO';

export type AccreditationStatus =
  | 'NO_ACREDITADO'
  | 'EN_REVISION'
  | 'ACREDITADO'
  | 'OBSERVADO';

export interface Document {
  id: string;
  tipo: DocumentType;
  nombre: string;
  descripcion?: string;
  archivoUrl: string;
  archivoNombre: string;
  archivoMimeType: string;
  archivoTamanio: number;
  empresaId: string;
  empresa?: Company;
  trabajadorId?: string;
  trabajador?: Worker;
  fechaEmision?: string;
  fechaVencimiento?: string;
  fechaRevision?: string;
  estado: DocumentStatus;
  estadoAcreditacion: AccreditationStatus;
  observacionesIA?: string;
  metadataIA?: Record<string, unknown>;
  version: number;
  versionHistorial?: DocumentVersion[];
  usuarioSubioId: string;
  usuarioSubio?: User;
  usuarioRevisoId?: string;
  usuarioReviso?: User;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentoId: string;
  version: number;
  archivoUrl: string;
  archivoNombre: string;
  archivoMimeType: string;
  archivoTamanio: number;
  metadataIA?: Record<string, unknown>;
  subidoPorId: string;
  createdAt: string;
}

export interface Project {
  id: string;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  cliente: string;
  empresaId: string;
  empresa?: Company;
  fechaInicio: string;
  fechaTermino?: string;
  estado: 'ACTIVO' | 'EN_PAUSA' | 'FINALIZADO' | 'CANCELADO';
  presupuesto?: number;
  moneda?: string;
  contratos?: Contract[];
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  numero: string;
  empresaId: string;
  empresa?: Company;
  proyectoId?: string;
  proyecto?: Project;
  tipo: 'SERVICIO' | 'SUMINISTRO' | 'OBRA' | 'ASESORIA' | 'OTRO';
  monto: number;
  moneda: string;
  fechaInicio: string;
  fechaTermino: string;
  estado: 'ACTIVO' | 'POR_FIRMAR' | 'FINALIZADO' | 'RESCINDIDO';
  documentoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  tipo: 'VENCIMIENTO' | 'DOCUMENTO_RECHAZADO' | 'INCUMPLIMIENTO' | 'SISTEMA';
  titulo: string;
  mensaje: string;
  leida: boolean;
  empresaId?: string;
  empresa?: Company;
  trabajadorId?: string;
  documentoId?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  accion: string;
  entidad: string;
  entidadId: string;
  usuarioId: string;
  usuario?: User;
  detalles?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

export interface ComplianceRule {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'DOCUMENTO' | 'CONTRATO' | 'CAPACITACION' | 'OTRO';
  documentoRequerido?: DocumentType[];
  diasAdvertencia: number;
  activa: boolean;
  empresaId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  empresasActivas: number;
  trabajadoresAcreditados: number;
  documentosVigentes: number;
  cumplimientoGlobal: number;
  cumplimientoPorEmpresa: {
    empresa: string;
    porcentaje: number;
    color: string;
  }[];
  tendenciaMensual: {
    mes: string;
    documentos: number;
    acreditados: number;
  }[];
  documentosPorEstado: {
    estado: string;
    cantidad: number;
    color: string;
  }[];
  ultimasAlertas: Alert[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  accessToken?: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  timestamp: string;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  details?: Record<string, string[]>;
  timestamp: string;
}
