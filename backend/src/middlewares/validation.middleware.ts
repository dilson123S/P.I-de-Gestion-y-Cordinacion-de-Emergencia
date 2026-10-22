/**
 * Middleware de validación con Zod
 * Fábrica que genera middlewares para validar body, query o params de la petición
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Fábrica de middleware para validación de datos con Zod
 * @param schema - Esquema Zod para validar los datos
 * @param source - Fuente de los datos a validar: 'body' | 'query' | 'params'
 * @returns Middleware de Express que valida los datos según el esquema
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validar y parsear los datos según la fuente indicada
      const datos = schema.parse(req[source]);

      // Reemplazar los datos originales con los datos validados/transformados
      req[source] = datos;

      next();
    } catch (error) {
      // Si es un error de validación de Zod, formatear los detalles
      if (error instanceof ZodError) {
        const erroresFormateados = error.errors.map((err) => ({
          campo: err.path.join('.'),
          mensaje: err.message,
        }));

        res.status(400).json({
          ok: false,
          mensaje: 'Error de validación en los datos enviados',
          errores: erroresFormateados,
        });
        return;
      }

      next(error);
    }
  };
}
