import axios from 'axios';
import { obtenerToken, eliminarToken } from './auth';

/**
 * Instancia de Axios preconfigurada para comunicarse con la API del backend.
 * Incluye interceptores para autenticación JWT y manejo de errores 401.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Interceptor de solicitud: agrega el token JWT al encabezado Authorization.
 * Si existe un token almacenado, se envía como Bearer token.
 */
api.interceptors.request.use(
  (config) => {
    const token = obtenerToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respuesta: maneja errores de autenticación.
 * Si el servidor responde con 401, elimina el token y redirige al login.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      eliminarToken();
      /* Solo redirigir si estamos en el navegador */
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
