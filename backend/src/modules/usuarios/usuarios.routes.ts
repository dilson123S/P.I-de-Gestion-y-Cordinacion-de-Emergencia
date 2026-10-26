/**
 * Rutas de Usuarios (Exclusivo Administrador)
 */

import { Router } from 'express';
import { listar, obtenerPorId, actualizar, crear, eliminar } from './usuarios.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/roles.middleware';
import { RolUsuario } from '@prisma/client';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(RolUsuario.ADMIN));

router.get('/', listar);
router.post('/', crear);
router.get('/:id', obtenerPorId);
router.patch('/:id', actualizar);
router.delete('/:id', eliminar);

export default router;
