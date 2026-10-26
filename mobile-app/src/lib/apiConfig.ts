import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
    return 'http://10.0.2.2:3001/api/v1';
  }

  return `http://${hostname}:3001/api/v1`;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || obtenerUrlApiDeDesarrollo() || 'http://localhost:3001/api/v1';
