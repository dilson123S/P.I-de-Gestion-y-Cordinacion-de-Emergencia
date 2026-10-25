/**
 * Definiciones de tipos TypeScript para la aplicación SIGEM Móvil.
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

/** Roles de usuario dentro del sistema */
export enum RolUsuario {
  CIUDADANO = 'CIUDADANO',
  OPERADOR = 'OPERADOR',
  DESPACHADOR = 'DESPACHADOR',
  PERSONAL_CAMPO = 'PERSONAL_CAMPO',
  ADMIN = 'ADMIN',
}

// Alias para compatibilidad con código existente
export type Rol = RolUsuario;
export const Rol = RolUsuario;

/** Estados operativos de una unidad de respuesta */
export enum EstadoUnidad {
  DISPONIBLE = 'DISPONIBLE',
  DESPACHADA = 'DESPACHADA',
  EN_ESCENA = 'EN_ESCENA',
  FUERA_DE_SERVICIO = 'FUERA_DE_SERVICIO',
}

/** Niveles de prioridad de una emergencia */
export enum Prioridad {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
  CRITICA = 'CRITICA',
}

/** Categorías de emergencias */
export enum CategoriaEmergencia {
  INCENDIO = 'INCENDIO',
  INUNDACION = 'INUNDACION',
  ACCIDENTE_TRANSITO = 'ACCIDENTE_TRANSITO',
  DERRUMBE = 'DERRUMBE',
  EMERGENCIA_MEDICA = 'EMERGENCIA_MEDICA',
  FUGA_GAS = 'FUGA_GAS',
  OTRO = 'OTRO',
}

/* ─── Interfaces de Modelos ─── */

/** Representa un usuario registrado en el sistema */
export interface Usuario {
  id: number | string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  rol: RolUsuario;
  activo?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  createdAt?: string;
  updatedAt?: string;
  unidadId?: string | number | null;
  unidad_asignada?: Unidad | null;
}

/** Catálogo de tipos de emergencia configurables (RF-09) */
export interface CatalogoTipoEmergencia {
  id: number;
  codigo?: string;
  nombre: string;
  descripcion?: string | null;
  prioridad_default?: number;
  icono?: string | null;
  activo?: boolean;
}

/** Unidad de respuesta (ambulancia, bomberos, patrulla, etc.) */
export interface Unidad {
  id: number | string;
  codigo?: string;
  nombre?: string;
  tipo: string;
  placa?: string | null;
  estado?: EstadoUnidad;
  disponible?: boolean;
  latitud_actual?: number | null;
  longitud_actual?: number | null;
  latitud?: number | null;
  longitud?: number | null;
  id_personal?: number | null;
  personal?: Usuario | null;
}

export type UnidadEmergencia = Unidad;

/** Registro de auditoría (RNF-09: Trazabilidad estricta) */
export interface LogAuditoria {
  id: number | string;
  id_emergencia: number | string;
  id_usuario_accion: number | string;
  fecha: string;
  accion_realizada: string;
  estado_anterior?: EstadoEmergencia | null;
  estado_nuevo?: EstadoEmergencia | null;
  datos_modificados?: Record<string, unknown> | null;
  ip_address?: string | null;
  usuario_accion?: Usuario;
  comentario?: string | null;
  createdAt?: string;
}

export type HistorialEstado = LogAuditoria;

/** Registro completo de una emergencia con actores y relaciones (RNF-07) */
export interface Emergencia {
  id: number | string;
  descripcion: string;
  latitud: number;
  longitud: number;
  evidencia_url?: string | null;
  fecha_creacion?: string;
  createdAt?: string;
  fecha_actualizacion?: string;
  updatedAt?: string;
  estado: EstadoEmergencia;
  prioridad?: number | Prioridad | null;
  categoria?: CategoriaEmergencia | string | null;

  /* Fases del flujo estricto */
  notas_clasificacion?: string | null;
  fecha_clasificacion?: string | null;

  notas_despacho?: string | null;
  fecha_asignacion?: string | null;

  notas_atencion?: string | null;
  fecha_inicio_atencion?: string | null;

  resolucion?: string | null;
  fecha_cierre?: string | null;

  /* Claves foráneas y actores */
  id_ciudadano?: number;
  reporteroId?: string | number;
  id_operador?: number | null;
  id_despachador?: number | null;
  id_unidad?: number | null;
  unidadId?: string | number | null;
  id_tipo_emergencia?: number | null;

  /* Relaciones */
  ciudadano?: Usuario;
  reportero?: Usuario;
  operador?: Usuario | null;
  despachador?: Usuario | null;
  unidad?: Unidad | null;
  tipo_emergencia?: CatalogoTipoEmergencia | null;
  historial?: HistorialEstado[];
  logs_auditoria?: LogAuditoria[];
}

/* ─── DTOs de Autenticación y Operación ─── */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistroData {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  password: string;
  rol?: RolUsuario;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface CrearEmergenciaData {
  descripcion: string;
  latitud: number;
  longitud: number;
  evidencia_url?: string;
}

export interface ActualizarEstadoData {
  estado: EstadoEmergencia;
  comentario?: string;
}

export interface PaginatedResponse<T> {
  data?: T[];
  datos?: T[];
  total: number;
  page?: number;
  pagina?: number;
  limit?: number;
  limite?: number;
}
