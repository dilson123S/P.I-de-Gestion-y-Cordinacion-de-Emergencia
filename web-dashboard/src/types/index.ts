/**
 * Definiciones de tipos TypeScript para el Sistema de Gestión de Emergencias.
 * Estas interfaces reflejan los modelos de Prisma del backend.
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

/** Roles de usuario dentro del sistema */
export enum RolUsuario {
  CIUDADANO = 'CIUDADANO',
  OPERADOR = 'OPERADOR',
  DESPACHADOR = 'DESPACHADOR',
  PERSONAL_CAMPO = 'PERSONAL_CAMPO',
  ADMIN = 'ADMIN',
}

/** Estados operativos de una unidad de respuesta */
export enum EstadoUnidad {
  DISPONIBLE = 'DISPONIBLE',
  DESPACHADO = 'DESPACHADO',
  EN_RUTA = 'EN_RUTA',
  EN_ESCENA = 'EN_ESCENA',
  FUERA_SERVICIO = 'FUERA_SERVICIO',
}

/** Niveles de prioridad para clasificar emergencias */
export enum NivelPrioridad {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA',
}

/* ─── Interfaces de Modelos ─── */

/** Representa un usuario registrado en el sistema */
export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  rol: RolUsuario;
  activo: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

/** Catálogo de tipos de emergencia configurables */
export interface CatalogoTipoEmergencia {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  prioridad_default: NivelPrioridad;
  icono: string | null;
  activo: boolean;
}

/** Unidad de respuesta (ambulancia, bomberos, policía, etc.) */
export interface Unidad {
  id: number;
  codigo: string;
  tipo: string;
  placa: string | null;
  estado: EstadoUnidad;
  latitud_actual: number | null;
  longitud_actual: number | null;
}

/** Registro completo de una emergencia con relaciones */
export interface Emergencia {
  id: number;
  descripcion: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  estado: EstadoEmergencia;
  prioridad: NivelPrioridad | null;
  notas_operador: string | null;
  notas_cierre: string | null;

  /* Claves foráneas */
  id_ciudadano: number;
  id_operador: number | null;
  id_despachador: number | null;
  id_unidad_asignada: number | null;
  id_tipo_emergencia: number | null;

  /* Relaciones pobladas */
  ciudadano?: Usuario;
  operador?: Usuario | null;
  despachador?: Usuario | null;
  unidad_asignada?: Unidad | null;
  tipo_emergencia?: CatalogoTipoEmergencia | null;

  /* Marcas de tiempo */
  fecha_reporte: string;
  fecha_clasificacion: string | null;
  fecha_asignacion: string | null;
  fecha_inicio_atencion: string | null;
  fecha_cierre: string | null;
}

/** Registro de auditoría que rastrea cada cambio en una emergencia */
export interface LogAuditoria {
  id: number;
  id_emergencia: number;
  id_usuario_accion: number;
  fecha: string;
  accion_realizada: string;
  estado_anterior: EstadoEmergencia | null;
  estado_nuevo: EstadoEmergencia | null;
  datos_modificados: Record<string, unknown> | null;

  /* Relaciones pobladas */
  usuario?: Usuario;
  emergencia?: Emergencia;
}

/* ─── Tipos de Respuesta de API ─── */

/** Respuesta estándar de la API con datos paginados */
export interface RespuestaPaginada<T> {
  datos: T[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

/** Respuesta de autenticación al iniciar sesión */
export interface RespuestaAuth {
  token: string;
  usuario: Usuario;
}

/** Respuesta estándar de la API */
export interface RespuestaAPI<T> {
  exito: boolean;
  mensaje?: string;
  datos: T;
}

/* ─── Tipos de Filtros ─── */

/** Filtros aplicables a la lista de emergencias */
export interface FiltrosEmergencia {
  estado?: EstadoEmergencia;
  prioridad?: NivelPrioridad;
  fecha_inicio?: string;
  fecha_fin?: string;
  busqueda?: string;
}
