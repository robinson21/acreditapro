import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        rol: string;
        tenantId: string;
      };
    }
  }
}

/**
 * Middleware de auditoría que registra en AuditLog las acciones POST/PUT/DELETE.
 * Extrae entidad y entidadId de req.params o req.body.
 */
export const auditLog = (req: Request, _res: Response, next: NextFunction): void => {
  // Solo registrar acciones de escritura
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    next();
    return;
  }

  // Capturar la respuesta original para registrar después de enviar
  const originalSend = _res.json.bind(_res);

  _res.json = function (body: unknown) {
    // Solo registrar si el usuario está autenticado
    if (req.user) {
      // Determinar la entidad y entidadId
      const entidad = inferEntity(req.baseUrl, req.path);
      const entidadId = extractEntityId(req);
      const accion = mapMethodToAction(method);

      // Ejecutar auditoría de forma asíncrona (no bloquear la respuesta)
      prisma.auditLog
        .create({
          data: {
            tenantId: req.user.tenantId,
            userId: req.user.id,
            accion,
            entidad,
            entidadId: entidadId || 'desconocido',
            detalle: JSON.stringify({
              metodo: method,
              ruta: req.originalUrl,
            }),
            ip: (req.ip as string) || (req.socket?.remoteAddress as string) || null,
            userAgent: (req.headers['user-agent'] as string) || null,
          },
        })
        .catch((err) => {
          console.error('Error al registrar auditoría:', err);
        });
    }

    return originalSend(body);
  };

  next();
};

/**
 * Infiere el nombre de la entidad a partir de la URL base.
 */
function inferEntity(baseUrl: string, path: string): string {
  const urlPath = path.split('/')[1] || baseUrl.split('/').pop() || 'unknown';

  const entityMap: Record<string, string> = {
    companies: 'Company',
    workers: 'Worker',
    documents: 'Document',
    contracts: 'Contract',
    projects: 'Project',
    alerts: 'Alert',
    users: 'User',
    tenants: 'Tenant',
    compliance: 'ComplianceRule',
  };

  return entityMap[urlPath] || urlPath;
}

/**
 * Extrae el ID de la entidad desde req.params o req.body.
 */
function extractEntityId(req: Request): string | null {
  const params = req.params as Record<string, string>;
  // Prioridad: params.id, params.workerId, params.companyId, body.id
  if (params.id) return params.id;
  if (params.workerId) return params.workerId;
  if (params.companyId) return params.companyId;
  if (params.contractId) return params.contractId;
  if (params.documentId) return params.documentId;
  if (req.body?.id) return req.body.id;

  return null;
}

/**
 * Mapea el método HTTP a una acción de auditoría.
 */
function mapMethodToAction(method: string): string {
  const actionMap: Record<string, string> = {
    POST: 'CREAR',
    PUT: 'ACTUALIZAR',
    PATCH: 'ACTUALIZAR',
    DELETE: 'ELIMINAR',
  };
  return actionMap[method] || method;
}
