/**
 * Middleware de autenticación JWT
 * Verifica el token en el encabezado Authorization y adjunta el usuario decodificado a la petición
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { RolUsuario } from '@prisma/client';

/**
 * Payload decodificado del token JWT
 */
export interface JwtPayload {
  id: number;
  email: string;
  rol: RolUsuario;
  iat?: number;
  exp?: number;
}

/**
 * Extensión del tipo Request de Express para incluir datos del usuario autenticado
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware que verifica la autenticación del usuario mediante JWT
 * Extrae el token del encabezado "Authorization: Bearer <token>"
 * y adjunta los datos decodificados a req.user
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Extraer el encabezado de autorización
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      ok: false,
      mensaje: 'Acceso denegado. Token no proporcionado.',
    });
    return;
  }

  // Obtener el token (sin el prefijo "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      ok: false,
      mensaje: 'Token inválido o expirado.',
    });
    return;
  }
}
