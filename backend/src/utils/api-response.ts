/**
 * Utilidades estandarizadas para respuestas de la API
 * Garantizan un formato consistente en todos los endpoints
 */

import { Response } from 'express';

/**
 * Estructura estándar de una respuesta exitosa
 */
interface SuccessResponsePayload<T> {
  ok: true;
  mensaje: string;
  datos: T;
}

/**
 * Estructura estándar de una respuesta de error
 */
interface ErrorResponsePayload {
  ok: false;
  mensaje: string;
  errores?: unknown;
}

/**
 * Envía una respuesta exitosa con formato estandarizado
 * @param res - Objeto Response de Express
 * @param datos - Datos a incluir en la respuesta
 * @param mensaje - Mensaje descriptivo de la operación
 * @param statusCode - Código HTTP (por defecto 200)
 */
export function successResponse<T>(
  res: Response,
  datos: T,
  mensaje: string = 'Operación exitosa',
  statusCode: number = 200
): Response<SuccessResponsePayload<T>> {
  return res.status(statusCode).json({
    ok: true,
    mensaje,
    datos,
  });
}

/**
 * Envía una respuesta de error con formato estandarizado
 * @param res - Objeto Response de Express
 * @param mensaje - Mensaje descriptivo del error
 * @param statusCode - Código HTTP (por defecto 500)
 * @param errores - Detalles adicionales del error (opcional)
 */
export function errorResponse(
  res: Response,
  mensaje: string = 'Error interno del servidor',
  statusCode: number = 500,
  errores?: unknown
): Response<ErrorResponsePayload> {
  return res.status(statusCode).json({
    ok: false,
    mensaje,
    errores,
  });
}
