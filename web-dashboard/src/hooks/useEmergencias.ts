'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type {
  Emergencia,
  FiltrosEmergencia,
} from '@/types';

/**
 * Hook personalizado para gestionar emergencias.
 * Proporciona funciones de listado, filtrado y operaciones CRUD.
 */
export function useEmergencias() {
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [filtros, setFiltros] = useState<FiltrosEmergencia>({});

  /**
   * Obtiene la lista de emergencias del servidor con filtros opcionales.
   * Actualiza el estado local con los resultados paginados.
   */
  const cargarEmergencias = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('pagina', pagina.toString());
      params.append('limite', '20');

      if (filtros.estado) params.append('estado', filtros.estado.toString());
      if (filtros.prioridad) params.append('prioridad', filtros.prioridad.toString());
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      if (filtros.busqueda) params.append('busqueda', filtros.busqueda);

      const respuesta = await api.get(`/emergencias?${params.toString()}`);
      const payload = respuesta.data?.datos;

      if (payload?.emergencias && Array.isArray(payload.emergencias)) {
        setEmergencias(payload.emergencias);
        setTotal(payload.paginacion?.total ?? payload.emergencias.length);
      } else if (Array.isArray(payload)) {
        setEmergencias(payload);
        setTotal(payload.length);
      } else {
        setEmergencias([]);
        setTotal(0);
      }
    } catch (err) {
      setError('Error al cargar las emergencias. Intente nuevamente.');
      console.error('Error cargando emergencias:', err);
    } finally {
      setCargando(false);
    }
  }, [pagina, filtros]);

  /** Carga las emergencias cada vez que cambian los filtros o la página */
  useEffect(() => {
    cargarEmergencias();
  }, [cargarEmergencias]);

  /**
   * Obtiene una emergencia individual por su ID.
   */
  const obtenerEmergencia = async (
    id: number | string
  ): Promise<Emergencia | null> => {
    try {
      const respuesta = await api.get(`/emergencias/${id}`);
      return respuesta.data?.datos || respuesta.data;
    } catch (err) {
      console.error('Error al obtener emergencia:', err);
      return null;
    }
  };

  /**
   * Clasifica una emergencia asignándole tipo y prioridad (RF-03).
   */
  const clasificarEmergencia = async (
    id: number | string,
    datos: { id_tipo_emergencia: number; prioridad: number; notas_clasificacion?: string }
  ) => {
    const respuesta = await api.patch(`/emergencias/${id}/clasificar`, datos);
    await cargarEmergencias();
    return respuesta.data?.datos || respuesta.data;
  };

  /**
   * Asigna una unidad de respuesta a una emergencia (RF-05).
   */
  const asignarUnidad = async (id: number | string, idUnidad: number, notas_despacho?: string) => {
    const respuesta = await api.patch(`/emergencias/${id}/asignar`, {
      id_unidad: idUnidad,
      notas_despacho,
    });
    await cargarEmergencias();
    return respuesta.data?.datos || respuesta.data;
  };

  /**
   * Cambia el estado de una emergencia.
   */
  const cambiarEstado = async (
    id: number | string,
    accion: 'iniciar-atencion' | 'cerrar',
    datos?: Record<string, unknown>
  ) => {
    const respuesta = await api.patch(`/emergencias/${id}/${accion}`, datos);
    await cargarEmergencias();
    return respuesta.data?.datos || respuesta.data;
  };

  /**
   * Actualiza los filtros de búsqueda y reinicia a la primera página.
   */
  const aplicarFiltros = (nuevosFiltros: FiltrosEmergencia) => {
    setFiltros(nuevosFiltros);
    setPagina(1);
  };

  return {
    emergencias,
    cargando,
    error,
    total,
    pagina,
    filtros,
    setPagina,
    aplicarFiltros,
    cargarEmergencias,
    obtenerEmergencia,
    clasificarEmergencia,
    asignarUnidad,
    cambiarEstado,
  };
}

export default useEmergencias;
