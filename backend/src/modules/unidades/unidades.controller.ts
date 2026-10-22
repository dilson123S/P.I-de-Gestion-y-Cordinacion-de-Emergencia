/**
 * Controlador de Unidades de Emergencia
 */

import { Request, Response, NextFunction } from 'express';
import { unidadesService } from './unidades.service';
import { successResponse, errorResponse } from '../../utils/api-response';
import { EstadoUnidad } from '@prisma/client';

export async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const estado = req.query.estado as EstadoUnidad | undefined;
    const unidades = await unidadesService.listar(estado);
    successResponse(res, unidades, 'Listado de unidades obtenido');
  } catch (error) {
    next(error);
  }
}

export async function obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const unidad = await unidadesService.obtenerPorId(id);
    if (!unidad) {
      errorResponse(res, 'Unidad no encontrada', 404);
      return;
    }
    successResponse(res, unidad);
  } catch (error) {
    next(error);
  }
}

export async function crear(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const nueva = await unidadesService.crear(req.body);
    successResponse(res, nueva, 'Unidad creada con éxito', 201);
  } catch (error) {
    next(error);
  }
}

export async function actualizarUbicacion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const { latitud, longitud } = req.body;
    const unidad = await unidadesService.actualizarUbicacion(id, latitud, longitud);
    successResponse(res, unidad, 'Ubicación de unidad actualizada');
  } catch (error) {
    next(error);
  }
}

export async function cambiarEstado(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const { estado } = req.body;
    const unidad = await unidadesService.cambiarEstado(id, estado);
    successResponse(res, unidad, 'Estado de unidad actualizado');
  } catch (error) {
    next(error);
  }
}
