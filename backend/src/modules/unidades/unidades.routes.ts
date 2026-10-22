/**
 * Rutas de Unidades de Emergencia
 */

import { Router } from 'express';
import { listar, obtenerPorId, crear, actualizarUbicacion, cambiarEstado } from './unidades.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/roles.middleware';
import { RolUsuario } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

// Listar y detalle disponible para operadores, despachadores, personal de campo y admin
router.get('/', listar);
router.get('/:id', obtenerPorId);

// Actualizar ubicación en tiempo real (Personal de campo, Admin)
router.patch('/:id/ubicacion', actualizarUbicacion);

// Cambiar estado operativo (Despachador, Personal de campo, Admin)
router.patch(
  '/:id/estado',
  requireRole(RolUsuario.DESPACHADOR, RolUsuario.PERSONAL_CAMPO, RolUsuario.ADMIN),
  cambiarEstado
);

// Registrar unidad (Admin)
router.post('/', requireRole(RolUsuario.ADMIN), crear);

export default router;
