/**
 * Controlador de Catálogo de Tipos de Emergencia
 */

import { Request, Response, NextFunction } from 'express';
import { catalogoService } from './catalogo.service';
import { successResponse, errorResponse } from '../../utils/api-response';

export async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const soloActivos = req.query.todos !== 'true';
    const items = await catalogoService.listar(soloActivos);
    successResponse(res, items, 'Catálogo obtenido exitosamente');
  } catch (error) {
    next(error);
  }
}

export async function obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await catalogoService.obtenerPorId(id);
    if (!item) {
      errorResponse(res, 'Elemento del catálogo no encontrado', 404);
      return;
    }
    successResponse(res, item);
  } catch (error) {
    next(error);
  }
}

export async function crear(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const nuevo = await catalogoService.crear(req.body);
    successResponse(res, nuevo, 'Tipo de emergencia registrado', 201);
  } catch (error) {
    next(error);
  }
}

export async function actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const actualizado = await catalogoService.actualizar(id, req.body);
    successResponse(res, actualizado, 'Tipo de emergencia actualizado');
  } catch (error) {
    next(error);
  }
}

export async function eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const eliminado = await catalogoService.eliminar(id);
    successResponse(res, eliminado, 'Tipo de emergencia desactivado');
  } catch (error) {
    next(error);
  }
}
