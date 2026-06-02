import { Request, Response, NextFunction } from 'express';
import { workerService } from '../services/worker.service';

/**
 * Controlador de trabajadores.
 * CRUD completo con filtro por empresa y paginación.
 */
export const workerController = {
  /**
   * GET /api/workers
   * Lista trabajadores con paginación y filtros.
   * Query params: companyId, estado, busqueda, page, limit
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { companyId, estado, busqueda, page, limit } = req.query as any;

      const result = await workerService.list(tenantId, companyId, {
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
   * GET /api/workers/:id
   * Obtiene un trabajador por su ID.
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const params = req.params as Record<string, string>;
      const { id } = params;
      const worker = await workerService.getById(id);
      res.json({ ok: true, data: worker });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/workers
   * Crea un nuevo trabajador.
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const worker = await workerService.create(req.body, tenantId);
      res.status(201).json({ ok: true, data: worker });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/workers/:id
   * Actualiza un trabajador existente.
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = req.params as Record<string, string>;
      const { id } = params;
      const worker = await workerService.update(id, req.body);
      res.json({ ok: true, data: worker });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/workers/:id/block
   * Bloquea un trabajador (cambia estado a BLOQUEADO).
   */
  async block(req: Request, res: Response, next: NextFunction) {
    try {
      const params = req.params as Record<string, string>;
      const { id } = params;
      const worker = await workerService.block(id);
      res.json({ ok: true, data: worker, message: 'Trabajador bloqueado exitosamente' });
    } catch (error) {
      next(error);
    }
  },
};
