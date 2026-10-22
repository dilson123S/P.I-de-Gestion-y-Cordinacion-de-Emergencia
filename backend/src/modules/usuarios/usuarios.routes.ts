/**
 * Rutas de Usuarios (Exclusivo Administrador)
 */

import { Router } from 'express';
import { listar, obtenerPorId, actualizar } from './usuarios.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/roles.middleware';
import { RolUsuario } from '@prisma/client';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(RolUsuario.ADMIN));

router.get('/', listar);
router.get('/:id', obtenerPorId);
router.patch('/:id', actualizar);

export default router;
