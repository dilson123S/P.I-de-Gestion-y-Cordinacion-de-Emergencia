/**
 * Hook reutilizable para gestión de ubicación del dispositivo.
 * Proporciona la ubicación actual con actualización automática
 * y funciones para refrescar la posición manualmente.
 */

import { useState, useEffect, useCallback } from 'react';
import { obtenerUbicacionActual, type Coordenadas } from '../lib/location';

/** Valor de retorno del hook de ubicación */
interface UseLocationReturn {
  /** Coordenadas actuales o null si no disponibles */
  ubicacion: Coordenadas | null;
  /** Indica si se está obteniendo la ubicación */
  cargando: boolean;
  /** Mensaje de error si la ubicación no pudo obtenerse */
  error: string | null;
  /** Función para refrescar la ubicación manualmente */
  refrescar: () => Promise<void>;
}

/**
 * Hook que gestiona la obtención y actualización de la ubicación
 * del dispositivo. Solicita permisos automáticamente al montar.
 * @param autoObtener - Si es true, obtiene la ubicación al montar (por defecto: true)
 */
export function useLocation(autoObtener: boolean = true): UseLocationReturn {
  const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Obtiene la ubicación actual del dispositivo */
  const refrescar = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const coords = await obtenerUbicacionActual();
      if (coords) {
        setUbicacion(coords);
      } else {
        setError('No se pudo obtener la ubicación');
      }
    } catch (err) {
      setError('Error al acceder a la ubicación del dispositivo');
      console.error('Error en useLocation:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  /** Obtiene la ubicación automáticamente al montar si autoObtener es true */
  useEffect(() => {
    if (autoObtener) {
      refrescar();
    }
  }, [autoObtener, refrescar]);

  return { ubicacion, cargando, error, refrescar };
}
