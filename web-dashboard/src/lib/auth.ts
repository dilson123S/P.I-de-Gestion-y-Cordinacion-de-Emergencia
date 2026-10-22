/**
 * Utilidades de autenticación para gestionar tokens JWT en el navegador.
 * Almacena y recupera tokens de localStorage de forma segura.
 */

const CLAVE_TOKEN = 'sigem_auth_token';
const CLAVE_USUARIO = 'sigem_usuario';

/**
 * Guarda el token JWT en localStorage.
 * @param token - Token JWT recibido del servidor
 */
export function guardarToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CLAVE_TOKEN, token);
  }
}

/**
 * Obtiene el token JWT almacenado.
 * @returns Token JWT o null si no existe
 */
export function obtenerToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(CLAVE_TOKEN);
  }
  return null;
}

/**
 * Elimina el token JWT y los datos de usuario del almacenamiento.
 * Se usa al cerrar sesión o cuando el token expira.
 */
export function eliminarToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
  }
}

/**
 * Guarda los datos del usuario autenticado en localStorage.
 * @param usuario - Objeto con los datos del usuario
 */
export function guardarUsuario(usuario: Record<string, unknown>): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
  }
}

/**
 * Obtiene los datos del usuario almacenado.
 * @returns Objeto del usuario o null si no hay sesión activa
 */
export function obtenerUsuarioStorage(): Record<string, unknown> | null {
  if (typeof window !== 'undefined') {
    const datos = localStorage.getItem(CLAVE_USUARIO);
    if (datos) {
      try {
        return JSON.parse(datos);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Verifica si existe un token de autenticación almacenado.
 * @returns true si hay un token presente
 */
export function estaAutenticado(): boolean {
  return obtenerToken() !== null;
}
