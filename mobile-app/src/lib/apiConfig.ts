import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BACKEND_PORT = process.env.EXPO_PUBLIC_BACKEND_PORT || '3005';

function obtenerUrlApiDeDesarrollo(): string | undefined {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return undefined;

  const host = hostUri.replace(/^https?:\/\//, '').split('/')[0];

  // El tunnel de Expo llega a Metro; metro.config.js reenvía /api/v1 al backend local.
  if (host.endsWith('.exp.direct')) {
    return `https://${host}/api/v1`;
  }

  const hostname = host.replace(/:\d+$/, '');
  if (hostname === 'localhost' && Platform.OS === 'android') {
    return `http://10.0.2.2:${BACKEND_PORT}/api/v1`;
  }

  return `http://${hostname}:${BACKEND_PORT}/api/v1`;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || obtenerUrlApiDeDesarrollo() || `http://localhost:${BACKEND_PORT}/api/v1`;

/**
 * Transforma URLs relativas de evidencias (/uploads/...) a URLs absolutas alcanzables por la app móvil
 */
export function obtenerUrlCompleta(url: string | null | undefined): string | null {
  if (!url) return null;
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('file:') ||
    url.startsWith('content:') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }

  const hostBase = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${hostBase}${path}`;
}
