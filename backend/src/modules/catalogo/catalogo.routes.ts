/**
 * Rutas de Catálogo de Tipos de Emergencia (RF-09)
 */

import { Router } from 'express';
import { listar, obtenerPorId, crear, actualizar, eliminar } from './catalogo.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/roles.middleware';
import { RolUsuario } from '@prisma/client';

const router = Router();

// Listado público o autenticado
router.get('/', listar);
router.get('/:id', obtenerPorId);

// Modificación reservada para administradores
router.post('/', authMiddleware, requireRole(RolUsuario.ADMIN), crear);
router.patch('/:id', authMiddleware, requireRole(RolUsuario.ADMIN), actualizar);
router.delete('/:id', authMiddleware, requireRole(RolUsuario.ADMIN), eliminar);

export default router;
