import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';

/**
 * Controlador de proyectos.
 * CRUD básico con filtros por tenant.
 */
export const projectController = {
  /**
   * GET /api/projects
   * Lista proyectos del tenant.
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await projectService.list(tenantId);
      res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/projects/:id
   * Obtiene un proyecto por su ID.
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const params = req.params as Record<string, string>;
      const { id } = params;
      const tenantId = req.user!.tenantId;

      const project = await projectService.getById(id, tenantId);
      res.json({ ok: true, data: project });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/projects
   * Crea un nuevo proyecto (solo ADMIN).
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const project = await projectService.create(req.body, tenantId);
      res.status(201).json({ ok: true, data: project });
    } catch (error) {
      next(error);
    }
  },
};
