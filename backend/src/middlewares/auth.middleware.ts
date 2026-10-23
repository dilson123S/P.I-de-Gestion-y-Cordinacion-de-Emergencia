/**
 * Middleware de autenticación JWT
 * Verifica el token en el encabezado Authorization y adjunta el usuario decodificado a la petición
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { RolUsuario } from '@prisma/client';

export interface JwtPayload {
  id: number;
  email: string;
  rol: RolUsuario;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      usuario?: JwtPayload;
    }
  }
}

/**
 * Middleware que verifica la autenticación del usuario mediante JWT
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      exito: false,
      mensaje: 'Acceso denegado. Token no proporcionado.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      exito: false,
      mensaje: 'Token inválido o expirado.',
    });
    return;
  }
}

export default authMiddleware;
