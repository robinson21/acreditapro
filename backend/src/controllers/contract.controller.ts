import { Request, Response, NextFunction } from 'express';
import { contractService } from '../services/contract.service';

/**
 * Controlador de contratos.
 * CRUD básico con filtros por tenant.
 */
export const contractController = {
  /**
   * GET /api/contracts
   * Lista contratos del tenant.
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await contractService.list(tenantId);
      res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/contracts/:id
   * Obtiene un contrato por su ID.
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const params = req.params as Record<string, string>;
      const { id } = params;
      const tenantId = req.user!.tenantId;

      const contract = await contractService.getById(id, tenantId);
      res.json({ ok: true, data: contract });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/contracts
   * Crea un nuevo contrato (solo ADMIN).
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const contract = await contractService.create(req.body, tenantId);
      res.status(201).json({ ok: true, data: contract });
    } catch (error) {
      next(error);
    }
  },
};
