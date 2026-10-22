/**
 * Utilidades de geolocalización para la aplicación.
 * Solicita permisos y obtiene la ubicación actual del dispositivo
 * usando expo-location.
 */

import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

/** Coordenadas geográficas */
export interface Coordenadas {
  latitud: number;
  longitud: number;
}

/**
 * Solicita permisos de ubicación al usuario.
 * Muestra alertas informativas si los permisos son denegados.
 * @returns true si los permisos fueron otorgados
 */
export async function solicitarPermisosUbicacion(): Promise<boolean> {
  const { status: existente } = await Location.getForegroundPermissionsAsync();

  if (existente === 'granted') {
    return true;
  }

  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Permisos de ubicación requeridos',
      'Necesitamos acceso a tu ubicación para reportar emergencias correctamente. ' +
        'Por favor, habilita los permisos en la configuración del dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir Configuración', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }

  return true;
}

/**
 * Obtiene la ubicación actual del dispositivo.
 * Solicita permisos automáticamente si no se han otorgado.
 * @returns Coordenadas actuales o null si no se pudo obtener la ubicación
 */
export async function obtenerUbicacionActual(): Promise<Coordenadas | null> {
  const tienePermisos = await solicitarPermisosUbicacion();

  if (!tienePermisos) {
    return null;
  }

  try {
    const ubicacion = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitud: ubicacion.coords.latitude,
      longitud: ubicacion.coords.longitude,
    };
  } catch (error) {
    console.error('Error al obtener ubicación:', error);
    Alert.alert(
      'Error de ubicación',
      'No se pudo obtener tu ubicación actual. Asegúrate de tener el GPS activado.'
    );
    return null;
  }
}

/**
 * Formatea las coordenadas para mostrar al usuario.
 * @param latitud - Latitud en grados decimales
 * @param longitud - Longitud en grados decimales
 * @returns Cadena legible con las coordenadas
 */
export function formatearCoordenadas(latitud: number, longitud: number): string {
  return `${latitud.toFixed(6)}, ${longitud.toFixed(6)}`;
}
