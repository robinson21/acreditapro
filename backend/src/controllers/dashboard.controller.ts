import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';

/**
 * Controlador del dashboard.
 * Proporciona estadísticas principales del tenant.
 */
export const dashboardController = {
  /**
   * GET /api/dashboard/stats
   * Obtiene estadísticas principales del tenant autenticado.
   * Incluye: empresas, trabajadores, documentos, alertas y cumplimiento.
   */
  async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const stats = await reportService.getDashboardStats(tenantId);
      res.json({ ok: true, data: stats });
    } catch (error) {
      next(error);
    }
  },
};
