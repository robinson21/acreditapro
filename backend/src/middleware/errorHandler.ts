import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * Clase personalizada para errores de la aplicación.
 * Incluye código de error HTTP, mensaje y código interno.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Mantener el stack trace correcto
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de manejo global de errores.
 * Captura todos los errores y devuelve una respuesta JSON estandarizada.
 */
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  // Log del error en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  // Error personalizado AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      ok: false,
      error: err.message,
      code: err.code,
      details: err.details || undefined,
    });
    return;
  }

  // Error de validación Zod
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      campo: e.path.join('.'),
      mensaje: e.message,
    }));
    res.status(400).json({
      ok: false,
      error: 'Error de validación',
      code: 'VALIDATION_ERROR',
      details,
    });
    return;
  }

  // Errores de Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(err);
    res.status(prismaError.statusCode).json({
      ok: false,
      error: prismaError.message,
      code: prismaError.code,
      details: prismaError.details,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      ok: false,
      error: 'Error de validación en la base de datos',
      code: 'DB_VALIDATION_ERROR',
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({
      ok: false,
      error: 'Error de conexión con la base de datos',
      code: 'DB_CONNECTION_ERROR',
    });
    return;
  }

  // Error de sintaxis JSON
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      ok: false,
      error: 'JSON mal formado en la solicitud',
      code: 'INVALID_JSON',
    });
    return;
  }

  // Error genérico - no exponer detalles en producción
  res.status(500).json({
    ok: false,
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
    code: 'INTERNAL_ERROR',
  });
};

/**
 * Maneja errores conocidos de Prisma y los traduce a respuestas HTTP.
 */
function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
  code: string;
  details?: unknown;
} {
  switch (err.code) {
    case 'P2002': {
      // Violación de restricción única
      const target = (err.meta?.target as string[]) || [];
      const campos = target.join(', ');
      return {
        statusCode: 409,
        message: `Ya existe un registro con el mismo valor en: ${campos}`,
        code: 'UNIQUE_CONSTRAINT',
        details: { campos: target },
      };
    }
    case 'P2025': {
      // Registro no encontrado
      return {
        statusCode: 404,
        message: 'Registro no encontrado',
        code: 'NOT_FOUND',
      };
    }
    case 'P2003': {
      // Violación de llave foránea
      return {
        statusCode: 400,
        message: 'El registro referenciado no existe',
        code: 'FOREIGN_KEY_ERROR',
      };
    }
    case 'P2014': {
      // Violación de relación
      return {
        statusCode: 400,
        message: 'Violación de integridad referencial',
        code: 'RELATION_VIOLATION',
      };
    }
    case 'P2016': {
      // Error de interpretación de consulta
      return {
        statusCode: 400,
        message: 'Error en la consulta a la base de datos',
        code: 'QUERY_INTERPRETATION_ERROR',
      };
    }
    default: {
      return {
        statusCode: 500,
        message: `Error de base de datos (${err.code})`,
        code: 'DATABASE_ERROR',
      };
    }
  }
}

/**
 * Middleware para manejar rutas no encontradas (404).
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    ok: false,
    error: 'Ruta no encontrada',
    code: 'ROUTE_NOT_FOUND',
  });
};
