/**
 * Utilidades de gestión de autenticación.
 * Maneja el almacenamiento seguro del token JWT
 * y los datos del usuario en AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Usuario } from '../types';

/** Clave de almacenamiento para el token JWT */
const TOKEN_KEY = '@sigem_token';
/** Clave de almacenamiento para los datos del usuario */
const USER_KEY = '@sigem_user';

/**
 * Guarda el token JWT en el almacenamiento local.
 * @param token - Token JWT recibido del servidor
 */
export async function guardarToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

/**
 * Obtiene el token JWT almacenado localmente.
 * @returns El token o null si no existe
 */
export async function obtenerToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

/**
 * Elimina el token JWT del almacenamiento local.
 */
export async function eliminarToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/**
 * Guarda los datos del usuario en el almacenamiento local.
 * @param usuario - Objeto con los datos del usuario autenticado
 */
export async function guardarUsuario(usuario: Usuario): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

/**
 * Obtiene los datos del usuario almacenados localmente.
 * @returns El objeto del usuario o null si no existe
 */
export async function obtenerUsuario(): Promise<Usuario | null> {
  const data = await AsyncStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as Usuario;
  } catch {
    return null;
  }
}

/**
 * Elimina todos los datos de autenticación del almacenamiento local.
 * Se usa al cerrar sesión para limpiar completamente el estado.
 */
export async function limpiarSesion(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
