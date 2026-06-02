import { Request, Response, NextFunction } from 'express';
import { documentService } from '../services/document.service';
import { uploadSingle } from '../middleware/upload';

/**
 * Controlador de documentos.
 * Maneja subida, listado, revisión y monitoreo de vencimientos.
 */
export const documentController = {
  /**
   * POST /api/documents/upload
   * Sube un documento junto con sus metadatos.
   * Multipart: file + campos JSON
   */
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      // Usar middleware de multer primero
      uploadSingle(req, res, async (err) => {
        if (err) {
          return next(err);
        }

        if (!req.file) {
          return res.status(400).json({
            ok: false,
            error: 'No se proporcionó ningún archivo',
            code: 'FILE_REQUIRED',
          });
        }

        try {
          const userId = req.user!.id;

          // Parsear metadata del body
          const metadata = {
            tenantId: req.user!.tenantId,
            companyId: req.body.companyId,
            categoria: req.body.categoria,
            tipoDocumento: req.body.tipoDocumento,
            workerId: req.body.workerId || undefined,
            contractId: req.body.contractId || undefined,
            fechaEmision: req.body.fechaEmision || undefined,
            fechaVencimiento: req.body.fechaVencimiento || undefined,
            numeroDocumento: req.body.numeroDocumento || undefined,
            organismoEmisor: req.body.organismoEmisor || undefined,
          };

          const result = await documentService.upload(req.file, metadata, userId);
          res.status(201).json({ ok: true, ...result });
        } catch (error) {
          next(error);
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/documents
   * Lista documentos con filtros avanzados.
   * Query params: estado, categoria, tipoDocumento, companyId, workerId, fechaDesde, fechaHasta, page, limit
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const {
        estado,
        categoria,
        tipoDocumento,
        companyId,
        workerId,
        fechaDesde,
        fechaHasta,
        page,
        limit,
      } = req.query as any;

      const result = await documentService.list(tenantId, {
        estado,
        categoria,
        tipoDocumento,
        companyId,
        workerId,
        fechaDesde,
        fechaHasta,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });

      res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/documents/:id
   * Obtiene un documento con todas sus versiones y revisiones.
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const params = req.params as Record<string, string>;
      const { id } = params;
      const document = await documentService.getById(id);
      res.json({ ok: true, data: document });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/documents/:id/review
   * Revisa un documento: lo aprueba o rechaza.
   */
  async review(req: Request, res: Response, next: NextFunction) {
    try {
      const params = req.params as Record<string, string>;
      const { id } = params;
      const userId = req.user!.id;
      const { decision, observaciones } = req.body;

      if (!decision || !['APROBADO', 'RECHAZADO'].includes(decision)) {
        res.status(400).json({
          ok: false,
          error: 'Decisión inválida. Use APROBADO o RECHAZADO',
          code: 'INVALID_DECISION',
        });
        return;
      }

      const review = await documentService.review(id, userId, decision, observaciones);
      res.json({ ok: true, data: review });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/documents/expiring
   * Obtiene documentos próximos a vencer.
   * Query params: dias (por defecto 30)
   */
  async getExpiring(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const dias = req.query.dias ? parseInt(req.query.dias as string, 10) : 30;

      const documents = await documentService.getExpiring(tenantId, dias);
      res.json({ ok: true, data: documents, count: documents.length });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/documents/expired
   * Obtiene documentos vencidos.
   */
  async getExpired(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const documents = await documentService.getExpired(tenantId);
      res.json({ ok: true, data: documents, count: documents.length });
    } catch (error) {
      next(error);
    }
  },
};
