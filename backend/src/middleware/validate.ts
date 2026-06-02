import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware de validación que valida req.body usando un esquema Zod.
 * Si la validación falla, devuelve un error 400 con detalles formateados.
 * @param schema Esquema Zod para validar el cuerpo de la solicitud
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.body);
      req.body = result; // Reemplazar con el valor parseado (y transformado)
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          campo: e.path.join('.'),
          mensaje: e.message,
        }));
        _res.status(400).json({
          ok: false,
          error: 'Error de validación',
          code: 'VALIDATION_ERROR',
          details,
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Middleware de validación para query parameters.
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.query);
      req.query = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          campo: e.path.join('.'),
          mensaje: e.message,
        }));
        _res.status(400).json({
          ok: false,
          error: 'Error de validación en parámetros de consulta',
          code: 'VALIDATION_QUERY_ERROR',
          details,
        });
        return;
      }
      next(error);
    }
  };
};
