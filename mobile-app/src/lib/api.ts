/**
 * Cliente HTTP configurado con Axios para comunicación con la API SIGEM.
 * Incluye interceptor automático para adjuntar el token JWT
 * almacenado en AsyncStorage a cada petición saliente.
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './apiConfig';

/** Clave de almacenamiento para el token JWT */
const TOKEN_KEY = '@sigem_token';
const USER_KEY = '@sigem_user';

let onUnauthorizedCallback: (() => void) | null = null;

export function registerOnUnauthorized(callback: () => void) {
  onUnauthorizedCallback = callback;
}

/**
 * URL base de la API.
 * En emuladores Android, 'localhost' apunta al propio emulador;
 * usar 10.0.2.2 o la IP de red local de la máquina anfitriona.
 */
/**
 * Instancia de Axios preconfigurada con la URL base
 * y cabeceras por defecto para JSON.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de solicitudes: adjunta automáticamente
 * el token JWT desde AsyncStorage si está disponible.
 */
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Error al leer token de AsyncStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respuestas: maneja errores globales
 * como tokens expirados (401) o errores del servidor.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      } catch {
        // Ignorar fallos de I/O al limpiar
      }
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
