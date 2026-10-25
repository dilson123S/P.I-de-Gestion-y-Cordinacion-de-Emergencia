/**
 * Esquemas Zod para validación del módulo de emergencias
 * Define las estructuras de datos para cada transición de estado
 */

import { z } from 'zod';

/** Esquema para crear un nuevo reporte de emergencia (RF-01) */
export const crearEmergenciaSchema = z.object({
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  evidencia_url: z.string().optional().nullable(),
});

/** Esquema para clasificar un reporte: REPORTADO → CLASIFICADO (RF-03) */
export const clasificarReporteSchema = z.object({
  id_tipo_emergencia: z.number().int().positive('Debe seleccionar un tipo de emergencia'),
  prioridad: z.number().int().min(1).max(5),
  notas_clasificacion: z.string().optional(),
});

/** Esquema para asignar unidad: CLASIFICADO → ASIGNADO (RF-05) */
export const asignarUnidadSchema = z.object({
  id_unidad: z.number().int().positive('Debe seleccionar una unidad'),
  notas_despacho: z.string().optional(),
});

/** Esquema para iniciar atención: ASIGNADO → EN_ATENCION */
export const iniciarAtencionSchema = z.object({
  notas_atencion: z.string().optional(),
});

/** Esquema para cerrar emergencia: EN_ATENCION → CERRADO */
export const cerrarEmergenciaSchema = z.object({
  resolucion: z.string().min(10, 'La resolución debe tener al menos 10 caracteres'),
});

/** Esquema de filtros para listar emergencias */
export const filtrosEmergenciasSchema = z.object({
  estado: z.enum(['REPORTADO', 'CLASIFICADO', 'ASIGNADO', 'EN_ATENCION', 'CERRADO']).optional(),
  prioridad: z.coerce.number().int().min(1).max(5).optional(),
  fecha_inicio: z.string().datetime().optional(),
  fecha_fin: z.string().datetime().optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
}).partial();

export type CrearEmergenciaInput = z.infer<typeof crearEmergenciaSchema>;
export type ClasificarReporteInput = z.infer<typeof clasificarReporteSchema>;
export type AsignarUnidadInput = z.infer<typeof asignarUnidadSchema>;
export type IniciarAtencionInput = z.infer<typeof iniciarAtencionSchema>;
export type CerrarEmergenciaInput = z.infer<typeof cerrarEmergenciaSchema>;
