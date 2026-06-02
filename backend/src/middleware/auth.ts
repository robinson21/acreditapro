import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config';
import { AppError } from './errorHandler';

// Extender la interfaz Request para incluir el usuario
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

// Para compatibilidad con Express 5, también declaramos en el módulo local
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    rol: string;
    tenantId: string;
  };
}

interface JwtPayload {
  id: string;
  email: string;
  rol: string;
  tenantId: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware que verifica el token JWT del usuario.
 * Extrae el token del header Authorization: Bearer <token>
 * Inyecta req.user con {id, email, rol, tenantId}
 */
export const verifyToken = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError('Token de autenticación requerido', 401, 'AUTH_TOKEN_REQUIRED');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError('Formato de token inválido. Use: Bearer <token>', 401, 'AUTH_INVALID_FORMAT');
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as JwtPayload;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        rol: decoded.rol,
        tenantId: decoded.tenantId,
      };
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expirado. Solicite un nuevo token.', 401, 'AUTH_TOKEN_EXPIRED');
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        throw new AppError('Token inválido.', 401, 'AUTH_TOKEN_INVALID');
      }
      throw new AppError('Error al verificar el token.', 401, 'AUTH_VERIFICATION_ERROR');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware que verifica que el usuario tenga uno de los roles especificados.
 * Debe usarse después de verifyToken.
 * @param roles Lista de roles permitidos (ej: 'ADMIN', 'REVISOR')
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('Usuario no autenticado.', 401, 'AUTH_NOT_AUTHENTICATED');
      }

      if (!roles.includes(req.user.rol)) {
        throw new AppError(
          `Acceso denegado. Se requiere uno de estos roles: ${roles.join(', ')}`,
          403,
          'AUTH_INSUFFICIENT_ROLE'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware opcional que intenta verificar el token pero no falla si no existe.
 * Útil para endpoints que pueden funcionar con o sin autenticación.
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol,
      tenantId: decoded.tenantId,
    };
    next();
  } catch {
    // Si el token es inválido, simplemente continuamos sin usuario
    next();
  }
};
