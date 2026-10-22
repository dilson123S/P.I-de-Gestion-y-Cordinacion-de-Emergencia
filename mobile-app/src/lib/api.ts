/**
 * Cliente HTTP configurado con Axios para comunicación con la API.
 * Incluye interceptor automático para adjuntar el token JWT
 * almacenado en AsyncStorage a cada petición saliente.
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Clave de almacenamiento para el token JWT */
const TOKEN_KEY = '@sigem_token';

/** URL base de la API (cambiar según entorno) */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Instancia de Axios preconfigurada con la URL base
 * y cabeceras por defecto para JSON.
 */
const api = axios.create({
  baseURL: BASE_URL,
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
      // Si falla la lectura del token, continuar sin él
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
      // Token expirado o inválido: limpiar almacenamiento
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export default api;
