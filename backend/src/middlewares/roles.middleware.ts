/**
 * Middleware de verificación de roles
 * Fábrica que genera un middleware para restringir acceso según el rol del usuario
 */

import { Request, Response, NextFunction } from 'express';
import { RolUsuario } from '@prisma/client';

export function requireRole(...roles: RolUsuario[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user || req.usuario;

    // Verificar que el usuario esté autenticado
    if (!user) {
      res.status(401).json({
        exito: false,
        mensaje: 'Acceso denegado. Usuario no autenticado.',
      });
      return;
    }

    // Verificar que el rol del usuario esté en la lista de roles permitidos.
    // - El rol ADMIN siempre tiene acceso a todas las rutas.
    // - Unificación Operador-Despachador (CAD Integral):
    //   Los roles OPERADOR, DESPACHADOR y OPERADOR_INTEGRAL son mutuamente equivalentes
    //   en todas las operaciones de triage, clasificación, despacho y control táctico.
    const rolUsuario = String(user.rol);
    const esOperadorCAD =
      rolUsuario === 'OPERADOR' ||
      rolUsuario === 'DESPACHADOR' ||
      rolUsuario === 'OPERADOR_INTEGRAL';

    const requiereOperadorODespachador =
      roles.includes(RolUsuario.OPERADOR) || roles.includes(RolUsuario.DESPACHADOR);

    const tieneAcceso =
      roles.includes(user.rol) ||
      rolUsuario === 'ADMIN' ||
      (esOperadorCAD && requiereOperadorODespachador);

    if (!tieneAcceso) {
      res.status(403).json({
        exito: false,
        mensaje: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

export default requireRole;
