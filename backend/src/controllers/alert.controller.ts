import { Request, Response, NextFunction } from 'express';
import { alertService } from '../services/alert.service';

/**
 * Controlador de alertas.
 * Lista alertas del usuario autenticado y permite marcarlas como leídas.
 */
export const alertController = {
  /**
   * GET /api/alerts
   * Lista las alertas del usuario autenticado.
   * Query params: leido (true/false) - opcional
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const leidoParam = req.query.leido;
      const leido = leidoParam !== undefined
        ? leidoParam === 'true'
        : undefined;

      const alerts = await alertService.getAlerts(userId, leido);
      res.json({ ok: true, data: alerts, count: alerts.length });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/alerts/:id/read
   * Marca una alerta como leída.
   */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const params = req.params as Record<string, string>;
      const { id } = params;
      const userId = req.user!.id;

      const alert = await alertService.markAsRead(id, userId);
      res.json({ ok: true, data: alert });
    } catch (error) {
      next(error);
    }
  },
};
