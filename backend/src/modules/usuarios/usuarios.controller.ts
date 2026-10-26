/**
 * Controlador de Usuarios
 */

import { Request, Response, NextFunction } from 'express';
import { usuariosService } from './usuarios.service';
import { successResponse, errorResponse } from '../../utils/api-response';
import { RolUsuario } from '@prisma/client';

export async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rol = req.query.rol as RolUsuario | undefined;
    const usuarios = await usuariosService.listar(rol);
    successResponse(res, usuarios, 'Usuarios obtenidos exitosamente');
  } catch (error) {
    next(error);
  }
}

export async function obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const usuario = await usuariosService.obtenerPorId(id);
    if (!usuario) {
      errorResponse(res, 'Usuario no encontrado', 404);
      return;
    }
    successResponse(res, usuario);
  } catch (error) {
    next(error);
  }
}

export async function actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const usuario = await usuariosService.actualizar(id, req.body);
    successResponse(res, usuario, 'Usuario actualizado exitosamente');
  } catch (error) {
    next(error);
  }
}

export async function eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const resultado = await usuariosService.eliminar(id);
    successResponse(res, resultado, 'Usuario eliminado exitosamente');
  } catch (error) {
    next(error);
  }
}

export async function crear(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const usuario = await usuariosService.crear(req.body);
    successResponse(res, usuario, 'Usuario creado exitosamente', 201);
  } catch (error: any) {
    if (error.code === 'P2002') {
      errorResponse(res, 'El correo electrónico ya se encuentra registrado', 409);
    } else {
      next(error);
    }
  }
}
