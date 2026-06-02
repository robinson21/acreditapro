import { Request, Response, NextFunction } from 'express';
import { companyService } from '../services/company.service';

/**
 * Controlador de empresas contratistas.
 * CRUD completo con filtros y paginación.
 */
export const companyController = {
  /**
   * GET /api/companies
   * Lista empresas con paginación y filtros.
   * Query params: estado, busqueda, page, limit
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const query = req.query as Record<string, string | undefined>;
      const { estado, busqueda } = query;
      const page = query.page;
      const limit = query.limit;

      const result = await companyService.list(tenantId, {
        estado,
        busqueda,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });

      res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/companies/:id
   * Obtiene una empresa por su ID.
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const params = req.params as Record<string, string>;
      const { id } = params;
      const tenantId = req.user!.tenantId;

      const company = await companyService.getById(id, tenantId);
      res.json({ ok: true, data: company });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/companies
   * Crea una nueva empresa contratista.
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const company = await companyService.create(req.body, tenantId, req.user!.id);
      res.status(201).json({ ok: true, data: company });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/companies/:id
   * Actualiza una empresa existente.
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = req.params as Record<string, string>;
      const { id } = params;
      const tenantId = req.user!.tenantId;

      const company = await companyService.update(id, req.body, tenantId);
      res.json({ ok: true, data: company });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/companies/:id/block
   * Bloquea una empresa (cambia estado a BLOQUEADO).
   */
  async block(req: Request, res: Response, next: NextFunction) {
    try {
      const params = req.params as Record<string, string>;
      const { id } = params;
      const tenantId = req.user!.tenantId;

      const company = await companyService.block(id, tenantId);
      res.json({ ok: true, data: company, message: 'Empresa bloqueada exitosamente' });
    } catch (error) {
      next(error);
    }
  },
};
