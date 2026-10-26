/**
 * Rutas del Módulo de Emergencias
 * Control de acceso granular por rol y validación de esquemas Zod
 */

import { Router } from 'express';
import { emergenciasController } from './emergencias.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/roles.middleware';
import { validate } from '../../middlewares/validation.middleware';
import {
  crearEmergenciaSchema,
  clasificarReporteSchema,
  asignarUnidadSchema,
  iniciarAtencionSchema,
  cerrarEmergenciaSchema,
} from './emergencias.schemas';
import { RolUsuario } from '@prisma/client';
import { subirEvidencia } from './evidencias.upload';
import { successResponse } from '../../utils/api-response';

const router = Router();

// Todas las rutas de emergencias requieren autenticación
router.use(authMiddleware);

// Sube evidencia móvil y devuelve una ruta HTTP que también puede abrir la web.
router.post('/evidencias', requireRole(RolUsuario.CIUDADANO, RolUsuario.ADMIN), subirEvidencia.single('archivo'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ ok: false, mensaje: 'Selecciona una imagen para adjuntar.' });
    return;
  }
  successResponse(res, { evidencia_url: `/uploads/${req.file.filename}` }, 'Evidencia subida exitosamente', 201);
});

router.post(
  '/:id/evidencia',
  requireRole(RolUsuario.CIUDADANO),
  subirEvidencia.single('archivo'),
  (req, res, next) => emergenciasController.adjuntarEvidencia(req, res, next)
);

// Mis reportes (Ciudadano)
router.get('/mis-reportes', (req, res, next) => emergenciasController.misReportes(req, res, next));

// Listar emergencias con filtros (Operador, Despachador, Admin)
router.get(
  '/',
  requireRole(RolUsuario.OPERADOR, RolUsuario.DESPACHADOR, RolUsuario.ADMIN, RolUsuario.PERSONAL_CAMPO),
  (req, res, next) => emergenciasController.listar(req, res, next)
);

// RF-01: Crear reporte inicial (Ciudadano o Admin)
router.post(
  '/',
  requireRole(RolUsuario.CIUDADANO, RolUsuario.ADMIN),
  validate(crearEmergenciaSchema),
  (req, res, next) => emergenciasController.crear(req, res, next)
);

// Obtener detalle de una emergencia
router.get('/:id', (req, res, next) => emergenciasController.obtenerPorId(req, res, next));

// RNF-09: Obtener historial de auditoría
router.get(
  '/:id/historial',
  requireRole(RolUsuario.OPERADOR, RolUsuario.DESPACHADOR, RolUsuario.ADMIN),
  (req, res, next) => emergenciasController.obtenerHistorial(req, res, next)
);

// RF-03: Clasificar reporte (Operador o Admin)
router.patch(
  '/:id/clasificar',
  requireRole(RolUsuario.OPERADOR, RolUsuario.ADMIN),
  validate(clasificarReporteSchema),
  (req, res, next) => emergenciasController.clasificar(req, res, next)
);

// RF-05: Asignar unidad de respuesta (Despachador o Admin)
router.patch(
  '/:id/asignar',
  requireRole(RolUsuario.DESPACHADOR, RolUsuario.ADMIN),
  validate(asignarUnidadSchema),
  (req, res, next) => emergenciasController.asignar(req, res, next)
);

// Iniciar atención en campo (Personal de campo, Operador o Admin)
router.patch(
  '/:id/iniciar-atencion',
  requireRole(RolUsuario.PERSONAL_CAMPO, RolUsuario.OPERADOR, RolUsuario.ADMIN),
  validate(iniciarAtencionSchema),
  (req, res, next) => emergenciasController.iniciarAtencion(req, res, next)
);

// Cerrar emergencia y registrar resolución (Personal de campo, Operador, Despachador o Admin)
router.patch(
  '/:id/cerrar',
  requireRole(RolUsuario.PERSONAL_CAMPO, RolUsuario.OPERADOR, RolUsuario.DESPACHADOR, RolUsuario.ADMIN),
  validate(cerrarEmergenciaSchema),
  (req, res, next) => emergenciasController.cerrar(req, res, next)
);

export default router;
