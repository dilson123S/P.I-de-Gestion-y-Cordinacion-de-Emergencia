/**
 * Definiciones de tipos TypeScript para el Sistema de Gestión de Emergencias.
 * Sincronizado con los modelos de Prisma y la API del backend.
 */

/* ─── Enumeraciones ─── */

/** Estados posibles de una emergencia durante su ciclo de vida */
export enum EstadoEmergencia {
  REPORTADO = 'REPORTADO',
  CLASIFICADO = 'CLASIFICADO',
  ASIGNADO = 'ASIGNADO',
  EN_ATENCION = 'EN_ATENCION',
  CERRADO = 'CERRADO',
}

/** Roles de usuario dentro del sistema (Arquitectura Web Bimodal: ADMIN y OPERADOR_INTEGRAL) */
export enum RolUsuario {
  ADMIN = 'ADMIN',
  OPERADOR_INTEGRAL = 'OPERADOR_INTEGRAL',
  // Alias y compatibilidad con registros preexistentes en BD
  OPERADOR = 'OPERADOR',
  DESPACHADOR = 'DESPACHADOR',
  PERSONAL_CAMPO = 'PERSONAL_CAMPO',
  CIUDADANO = 'CIUDADANO',
}

/** Formatea los roles con nombres legibles institucionales para la consola web */
export function formatearRol(rol?: string | RolUsuario): string {
  if (!rol) return '';
  const r = String(rol);
  if (r === 'ADMIN' || r === RolUsuario.ADMIN) {
    return 'Administrador';
  }
  if (
    r === 'OPERADOR_INTEGRAL' ||
    r === RolUsuario.OPERADOR_INTEGRAL ||
    r === 'OPERADOR' ||
    r === RolUsuario.OPERADOR ||
    r === 'DESPACHADOR' ||
    r === RolUsuario.DESPACHADOR
  ) {
    return 'Operador Integral';
  }
  if (r === 'PERSONAL_CAMPO' || r === RolUsuario.PERSONAL_CAMPO) {
    return 'Personal de Campo';
  }
  if (r === 'CIUDADANO' || r === RolUsuario.CIUDADANO) {
    return 'Ciudadano';
  }
  return r;
}

/** Verifica si un rol corresponde al Operador Integral (Triage y Despacho unificados) */
export function esOperadorIntegral(rol?: string | RolUsuario): boolean {
  if (!rol) return false;
  const r = String(rol);
  return (
    r === 'OPERADOR_INTEGRAL' ||
    r === RolUsuario.OPERADOR_INTEGRAL ||
    r === 'OPERADOR' ||
    r === RolUsuario.OPERADOR ||
    r === 'DESPACHADOR' ||
    r === RolUsuario.DESPACHADOR ||
    r === 'ADMIN' ||
    r === RolUsuario.ADMIN
  );
}

/** Estados operativos de una unidad de respuesta */
export enum EstadoUnidad {
  DISPONIBLE = 'DISPONIBLE',
  DESPACHADA = 'DESPACHADA',
  EN_ESCENA = 'EN_ESCENA',
  FUERA_DE_SERVICIO = 'FUERA_DE_SERVICIO',
}

/* ─── Interfaces de Modelos ─── */

/** Representa un usuario registrado en el sistema */
export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  rol: RolUsuario;
  activo: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  unidad_asignada?: Unidad | null;
}

/** Catálogo de tipos de emergencia configurables (RF-09) */
export interface CatalogoTipoEmergencia {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  prioridad_default: number;
  icono?: string | null;
  activo: boolean;
}

/** Unidad de respuesta (ambulancia, bomberos, patrulla, etc.) */
export interface Unidad {
  id: number;
  codigo: string;
  tipo: string;
  placa?: string | null;
  estado: EstadoUnidad;
  latitud_actual?: number | null;
  longitud_actual?: number | null;
  id_personal?: number | null;
  personal?: Usuario | null;
}

/** Registro completo de una emergencia con actores y relaciones (RNF-07) */
export interface Emergencia {
  id: number;
  descripcion: string;
  latitud: number;
  longitud: number;
  evidencia_url?: string | null;
  fecha_creacion: string;
  estado: EstadoEmergencia;
  prioridad: number;

  /* Fases del flujo estricto */
  notas_clasificacion?: string | null;
  fecha_clasificacion?: string | null;

  notas_despacho?: string | null;
  fecha_asignacion?: string | null;

  notas_atencion?: string | null;
  fecha_inicio_atencion?: string | null;

  resolucion?: string | null;
  fecha_cierre?: string | null;

  /* Claves foráneas */
  id_ciudadano: number;
  id_operador?: number | null;
  id_despachador?: number | null;
  id_unidad?: number | null;
  id_tipo_emergencia?: number | null;

  /* Relaciones pobladas */
  ciudadano?: Usuario;
  operador?: Usuario | null;
  despachador?: Usuario | null;
  unidad?: Unidad | null;
  tipo_emergencia?: CatalogoTipoEmergencia | null;
  logs_auditoria?: LogAuditoria[];
}

/** Registro de auditoría (RNF-09: Trazabilidad estricta) */
export interface LogAuditoria {
  id: number;
  id_emergencia: number;
  id_usuario_accion: number;
  fecha: string;
  accion_realizada: string;
  estado_anterior?: EstadoEmergencia | null;
  estado_nuevo?: EstadoEmergencia | null;
  datos_modificados?: Record<string, unknown> | null;
  ip_address?: string | null;

  /* Relaciones */
  usuario_accion?: Usuario;
  emergencia?: Emergencia;
}

/* ─── Tipos de Respuesta de API ─── */

export interface RespuestaPaginada<T> {
  datos: T[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

export interface RespuestaAuth {
  token: string;
  usuario: Usuario;
}

export interface RespuestaAPI<T> {
  exito: boolean;
  mensaje?: string;
  datos: T;
}

/* ─── Filtros de búsqueda ─── */
export interface FiltrosEmergencia {
  estado?: EstadoEmergencia | string;
  prioridad?: number | string;
  fecha_inicio?: string;
  fecha_fin?: string;
  busqueda?: string;
}
