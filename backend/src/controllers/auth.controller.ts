import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { z } from 'zod';

// Schema de validación para login
const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  tenantId: z.string().optional(),
});

// Schema de validación para refresh token
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});

// Schema de validación para cambio de contraseña
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

/**
 * Controlador de autenticación.
 * Maneja login, refresh token y cambio de contraseña.
 */
export const authController = {
  /**
   * POST /api/auth/login
   * Inicia sesión con email y contraseña.
   * tenantId es opcional (se auto-detecta en entornos con un solo tenant).
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = loginSchema.parse(req.body);
      const result = await authService.login(input);
      res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/refresh
   * Refresca el token de acceso usando un refresh token válido.
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const input = refreshSchema.parse(req.body);
      const result = await authService.refreshToken(input.refreshToken);
      res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/change-password
   * Cambia la contraseña del usuario autenticado.
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const input = changePasswordSchema.parse(req.body);
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ ok: false, error: 'No autenticado' });
      }
      await authService.changePassword(userId, input.oldPassword, input.newPassword);
      return res.json({ ok: true, mensaje: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      next(error);
      return;
    }
  },
};
