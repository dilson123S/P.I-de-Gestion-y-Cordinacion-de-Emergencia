/**
 * Rutas del módulo de autenticación
 * Define los endpoints para registro e inicio de sesión
 */

import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middlewares/validation.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { loginSchema, registerSchema } from './auth.schemas';

const router = Router();

// POST /api/v1/auth/registrar - Registro de nuevo usuario
router.post('/registrar', validate(registerSchema), authController.registrar);

// POST /api/v1/auth/login - Inicio de sesión
router.post('/login', validate(loginSchema), authController.login);

// GET /api/v1/auth/me - Perfil actualizado en tiempo real
router.get('/me', authMiddleware, authController.obtenerPerfil);

export default router;
