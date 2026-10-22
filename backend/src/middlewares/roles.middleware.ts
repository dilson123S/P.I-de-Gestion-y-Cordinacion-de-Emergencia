/**
 * Middleware de verificación de roles
 * Fábrica que genera un middleware para restringir acceso según el rol del usuario
 */

import { Request, Response, NextFunction } from 'express';
import { RolUsuario } from '@prisma/client';

/**
 * Fábrica de middleware para verificación de roles
 * Retorna un middleware que verifica si el usuario autenticado tiene uno de los roles permitidos
 * @param roles - Lista de roles permitidos para acceder al recurso
 * @returns Middleware de Express que valida el rol del usuario
 */
export function requireRole(...roles: RolUsuario[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      res.status(401).json({
        ok: false,
        mensaje: 'Acceso denegado. Usuario no autenticado.',
      });
      return;
    }

    // Verificar que el rol del usuario esté en la lista de roles permitidos
    if (!roles.includes(req.user.rol)) {
      res.status(403).json({
        ok: false,
        mensaje: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
}
