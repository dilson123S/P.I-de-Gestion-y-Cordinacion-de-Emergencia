/**
 * Controlador de autenticación
 * Maneja las peticiones HTTP de registro e inicio de sesión
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { successResponse, errorResponse } from '../../utils/api-response';

/**
 * POST /api/v1/auth/registrar
 * Registra un nuevo usuario en el sistema
 */
export async function registrar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const usuario = await authService.register(req.body);
    successResponse(res, usuario, 'Usuario registrado exitosamente', 201);
  } catch (error: any) {
    if (error.statusCode) {
      errorResponse(res, error.message, error.statusCode);
      return;
    }
    next(error);
  }
}

/**
 * POST /api/v1/auth/login
 * Autentica un usuario y retorna un token JWT
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resultado = await authService.login(req.body);
    successResponse(res, resultado, 'Inicio de sesión exitoso');
  } catch (error: any) {
    if (error.statusCode) {
      errorResponse(res, error.message, error.statusCode);
      return;
    }
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 * Retorna el perfil en tiempo real del usuario autenticado con su unidad asignada
 */
export async function obtenerPerfil(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const idUsuario = req.usuario!.id;
    const usuario = await authService.obtenerPerfil(idUsuario);
    successResponse(res, usuario, 'Perfil obtenido exitosamente');
  } catch (error: any) {
    if (error.statusCode) {
      errorResponse(res, error.message, error.statusCode);
      return;
    }
    next(error);
  }
}
