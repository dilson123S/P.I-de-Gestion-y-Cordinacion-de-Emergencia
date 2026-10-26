/**
 * Middleware global de manejo de errores
 * Captura todos los errores no controlados y los formatea de manera consistente
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Clase de error operacional con código de estado HTTP
 */
export class AppError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Middleware global de manejo de errores de Express
 * Debe registrarse como el último middleware en la cadena
 */
export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Registrar el error en consola para depuración
  console.error('❌ Error no controlado:', err.message);

  if (config.nodeEnv === 'development') {
    console.error(err.stack);
  }

  // Determinar el código de estado HTTP apropiado
  const statusCode = (err as any).statusCode || 500;
  const mensaje = statusCode === 500
    ? 'Error interno del servidor'
    : err.message;

  res.status(statusCode).json({
    ok: false,
    mensaje,
    // Solo incluir detalles del error en desarrollo
    ...(config.nodeEnv === 'development' && {
      errores: {
        message: err.message,
        stack: err.stack,
      },
    }),
  });
}
