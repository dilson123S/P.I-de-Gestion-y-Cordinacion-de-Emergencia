/**
 * Definiciones de tipos e interfaces para la aplicación SIGEM - Emergencias.
 * Estos tipos reflejan los modelos del backend y se comparten
 * con la aplicación web para mantener consistencia.
 */

/** Roles disponibles en el sistema */
export enum Rol {
  CIUDADANO = 'CIUDADANO',
  OPERADOR = 'OPERADOR',
  COORDINADOR = 'COORDINADOR',
  PERSONAL_CAMPO = 'PERSONAL_CAMPO',
  ADMIN = 'ADMIN',
}

/** Estados posibles de una emergencia */
export enum EstadoEmergencia {
  REPORTADO = 'REPORTADO',
  CLASIFICADO = 'CLASIFICADO',
  ASIGNADO = 'ASIGNADO',
  EN_ATENCION = 'EN_ATENCION',
  CERRADO = 'CERRADO',
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

/** Modelo de usuario del sistema */
export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: Rol;
  activo: boolean;
  unidadId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Modelo principal de emergencia */
export interface Emergencia {
  id: string;
  descripcion: string;
  latitud: number;
  longitud: number;
  estado: EstadoEmergencia;
  prioridad?: Prioridad | null;
  categoria?: CategoriaEmergencia | null;
  evidencia_url?: string | null;
  reporteroId: string;
  reportero?: Usuario;
  unidadId?: string | null;
  unidad?: UnidadEmergencia;
  historial?: HistorialEstado[];
  createdAt: string;
  updatedAt: string;
}

/** Modelo de unidad de emergencia (bomberos, policía, etc.) */
export interface UnidadEmergencia {
  id: string;
  nombre: string;
  tipo: string;
  disponible: boolean;
  latitud?: number | null;
  longitud?: number | null;
}

/** Registro del historial de cambios de estado de una emergencia */
export interface HistorialEstado {
  id: string;
  emergenciaId: string;
  estadoAnterior: EstadoEmergencia | null;
  estadoNuevo: EstadoEmergencia;
  comentario?: string | null;
  usuarioId: string;
  usuario?: Usuario;
  createdAt: string;
}

/** Datos necesarios para iniciar sesión */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Datos necesarios para registrar un ciudadano */
export interface RegistroData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
}

/** Respuesta de autenticación del servidor */
export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

/** Datos para crear un nuevo reporte de emergencia */
export interface CrearEmergenciaData {
  descripcion: string;
  latitud: number;
  longitud: number;
  evidencia_url?: string;
}

/** Datos para actualizar el estado de una emergencia */
export interface ActualizarEstadoData {
  estado: EstadoEmergencia;
  comentario?: string;
}

/** Respuesta paginada genérica de la API */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
