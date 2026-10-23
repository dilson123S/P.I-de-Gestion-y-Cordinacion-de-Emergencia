'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Layers, MapPin, RefreshCw, AlertTriangle, Truck, Compass } from 'lucide-react';
import Button from '@/components/ui/Button';
import EstadoBadge from '@/components/emergencias/EstadoBadge';
import { api } from '@/lib/api';
import { Emergencia, Unidad, EstadoEmergencia } from '@/types';
import { mockEmergencias, mockUnidades } from '@/lib/mock-data';

// Import dinámico de MapaInteractivo para evitar SSR de Leaflet
const MapaInteractivo = dynamic(() => import('@/components/mapa/MapaInteractivo'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[650px] bg-slate-100 flex flex-col items-center justify-center rounded-xl border border-slate-200">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-3" />
      <p className="text-sm font-medium text-slate-600">Cargando capas satelitales y geolocalización...</p>
    </div>
  ),
});

export default function MapaGeneralPage() {
  const [emergencias, setEmergencias] = useState<Emergencia[]>(mockEmergencias);
  const [unidades, setUnidades] = useState<Unidad[]>(mockUnidades);
  const [seleccionadaId, setSeleccionadaId] = useState<number | undefined>(undefined);
  const [cargando, setCargando] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resEme, resUni] = await Promise.all([
        api.get('/emergencias?limite=50'),
        api.get('/unidades'),
      ]);

      if (resEme.data?.datos?.emergencias && resEme.data.datos.emergencias.length > 0) {
        setEmergencias(resEme.data.datos.emergencias);
      }
      if (resUni.data?.datos && resUni.data.datos.length > 0) {
        setUnidades(resUni.data.datos);
      }
    } catch {
      // Fallback a mock data
      setEmergencias(mockEmergencias);
      setUnidades(mockUnidades);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const activas = emergencias.filter((e) => e.estado !== EstadoEmergencia.CERRADO);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Compass className="h-7 w-7 text-blue-600" />
            Monitoreo Geográfico y Despacho en Vivo
          </h1>
          <p className="text-sm text-slate-500">
            Visualización geoespacial de incidentes en tiempo real y posición de unidades de auxilio
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={cargarDatos} disabled={cargando} className="flex items-center gap-1.5">
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar Posiciones
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel Lateral: Lista de Incidentes Activos para Selección Rápida */}
        <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col h-[700px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Incidentes Activos ({activas.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {activas.map((e) => {
              const esSeleccionado = e.id === seleccionadaId;
              return (
                <div
                  key={e.id}
                  onClick={() => setSeleccionadaId(e.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    esSeleccionado
                      ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900">#{e.id}</span>
                    <EstadoBadge estado={e.estado} />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {e.tipo_emergencia?.icono} {e.tipo_emergencia?.nombre || 'General'}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{e.descripcion}</p>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-1.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {e.latitud.toFixed(4)}, {e.longitud.toFixed(4)}
                    </span>
                    {e.prioridad === 1 && (
                      <span className="text-red-600 font-bold text-[10px]">P1 CRÍTICO</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-3 mt-3 text-xs text-slate-500">
            <p className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-indigo-600" />
              <span>Unidades en servicio: <strong>{unidades.length}</strong></span>
            </p>
          </div>
        </div>

        {/* Mapa Interactivo Principal */}
        <div className="lg:col-span-3">
          <MapaInteractivo
            emergencias={emergencias}
            unidades={unidades}
            emergenciaSeleccionadaId={seleccionadaId}
            onSeleccionarEmergencia={(id) => setSeleccionadaId(id)}
            altura="700px"
          />
        </div>
      </div>
    </div>
  );
}
