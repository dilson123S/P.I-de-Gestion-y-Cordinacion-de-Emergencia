'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Emergencia, EstadoEmergencia, Unidad, EstadoUnidad } from '@/types';
import { MapPin, Navigation, Eye, Layers, Filter } from 'lucide-react';

interface MapaInteractivoProps {
  emergencias: Emergencia[];
  unidades?: Unidad[];
  centro?: [number, number];
  zoom?: number;
  emergenciaSeleccionadaId?: number;
  onSeleccionarEmergencia?: (id: number) => void;
  altura?: string;
  mostrarControles?: boolean;
}

export default function MapaInteractivo({
  emergencias,
  unidades = [],
  centro = [10.4110, -75.5300], // Cartagena de Indias, Colombia
  zoom = 13,
  emergenciaSeleccionadaId,
  onSeleccionarEmergencia,
  altura = '500px',
  mostrarControles = true,
}: MapaInteractivoProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routesLayerRef = useRef<any>(null);

  const [filtroCapa, setFiltroCapa] = useState<'todos' | 'emergencias' | 'unidades'>('todos');
  const [mapaListo, setMapaListo] = useState(false);

  // Inicialización del mapa de Leaflet
  useEffect(() => {
    let map: any = null;

    async function initMap() {
      if (!mapContainerRef.current) return;

      // Import dinámico de Leaflet solo en cliente
      const L = (await import('leaflet')).default;

      // Si ya existe instancia previa, destruirla limpiamente
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Crear mapa
      map = L.map(mapContainerRef.current, {
        center: centro,
        zoom,
        zoomControl: true,
      });

      // Capa base de OpenStreetMap con estilo limpio
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contribuyentes',
        maxZoom: 19,
      }).addTo(map);

      // Grupos de capas
      markersLayerRef.current = L.layerGroup().addTo(map);
      routesLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      setMapaListo(true);
    }

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Actualización de marcadores y rutas al cambiar datos o filtros
  useEffect(() => {
    if (!mapaListo || !mapInstanceRef.current) return;

    async function actualizarCapas() {
      const L = (await import('leaflet')).default;
      const markersLayer = markersLayerRef.current;
      const routesLayer = routesLayerRef.current;

      if (!markersLayer || !routesLayer) return;

      markersLayer.clearLayers();
      routesLayer.clearLayers();

      const bounds: any[] = [];

      // 1. DIBUJAR EMERGENCIAS
      if (filtroCapa === 'todos' || filtroCapa === 'emergencias') {
        emergencias.forEach((e) => {
          if (!e.latitud || !e.longitud) return;

          bounds.push([e.latitud, e.longitud]);

          // Color y diseño del marcador según estado y prioridad
          let bgClass = 'bg-amber-500';
          let borderClass = 'border-amber-700';

          switch (e.estado) {
            case EstadoEmergencia.REPORTADO:
              bgClass = 'bg-amber-500';
              borderClass = 'border-amber-600';
              break;
            case EstadoEmergencia.CLASIFICADO:
              bgClass = 'bg-blue-600';
              borderClass = 'border-blue-700';
              break;
            case EstadoEmergencia.ASIGNADO:
              bgClass = 'bg-purple-600';
              borderClass = 'border-purple-700';
              break;
            case EstadoEmergencia.EN_ATENCION:
              bgClass = 'bg-orange-500';
              borderClass = 'border-orange-600';
              break;
            case EstadoEmergencia.CERRADO:
              bgClass = 'bg-green-600';
              borderClass = 'border-green-700';
              break;
          }

          const esCritica = e.prioridad === 1;
          const animClass = esCritica ? 'pulse-marker-critical' : '';
          const icono = e.tipo_emergencia?.icono || '🚨';

          const customIcon = L.divIcon({
            className: 'custom-leaflet-icon',
            html: `
              <div class="custom-emergency-marker ${bgClass} ${borderClass} ${animClass} border-2 text-base w-9 h-9 flex items-center justify-center cursor-pointer">
                <span>${icono}</span>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18],
          });

          const marker = L.marker([e.latitud, e.longitud], { icon: customIcon });

          const popupHtml = `
            <div style="font-family: inherit; font-size: 13px; min-width: 200px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 14px; color: #0f172a;">Caso #${e.id}</strong>
                <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 9999px; background: #e2e8f0;">${e.estado}</span>
              </div>
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #1e3a8a;">${e.tipo_emergencia ? e.tipo_emergencia.nombre : 'Sin tipificar'}</p>
              <p style="margin: 0 0 8px 0; color: #475569; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${e.descripcion}</p>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 6px;">
                <span style="font-size: 11px; color: #64748b;">Prioridad: P${e.prioridad}</span>
                <a href="/dashboard/emergencias/${e.id}" style="color: #2563eb; font-weight: bold; text-decoration: none; font-size: 12px;">Ver Caso &rarr;</a>
              </div>
            </div>
          `;

          marker.bindPopup(popupHtml);

          if (e.id === emergenciaSeleccionadaId) {
            marker.openPopup();
          }

          marker.addTo(markersLayer);

          // Si tiene unidad asignada y ambas tienen coordenadas, trazar ruta visual
          if (e.unidad && e.unidad.latitud_actual && e.unidad.longitud_actual) {
            const ruta = L.polyline(
              [
                [e.unidad.latitud_actual, e.unidad.longitud_actual],
                [e.latitud, e.longitud],
              ],
              {
                color: '#8b5cf6',
                weight: 3,
                dashArray: '6, 8',
                opacity: 0.8,
              }
            );
            ruta.addTo(routesLayer);
          }
        });
      }

      // 2. DIBUJAR UNIDADES DE RESPUESTA
      if (filtroCapa === 'todos' || filtroCapa === 'unidades') {
        unidades.forEach((u) => {
          if (!u.latitud_actual || !u.longitud_actual) return;

          bounds.push([u.latitud_actual, u.longitud_actual]);

          let iconoVehiculo = '🚑';
          if (u.tipo.toLowerCase().includes('bomba') || u.tipo.toLowerCase().includes('bombero')) {
            iconoVehiculo = '🚒';
          } else if (u.tipo.toLowerCase().includes('patrulla') || u.tipo.toLowerCase().includes('polic')) {
            iconoVehiculo = '🚓';
          }

          const unitIcon = L.divIcon({
            className: 'custom-unit-icon',
            html: `
              <div class="flex flex-col items-center">
                <div class="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg text-sm">
                  ${iconoVehiculo}
                </div>
                <span class="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.2 rounded shadow mt-0.5 whitespace-nowrap">
                  ${u.codigo}
                </span>
              </div>
            `,
            iconSize: [40, 48],
            iconAnchor: [20, 24],
            popupAnchor: [0, -24],
          });

          const unitMarker = L.marker([u.latitud_actual, u.longitud_actual], { icon: unitIcon });

          const unitPopupHtml = `
            <div style="font-family: inherit; font-size: 13px;">
              <strong style="color: #1e1b4b; font-size: 14px;">${u.codigo} - ${u.tipo}</strong>
              <p style="margin: 4px 0; color: #475569;">Estado: <strong>${u.estado}</strong></p>
              ${u.placa ? `<p style="margin: 0; color: #64748b; font-size: 11px;">Placa: ${u.placa}</p>` : ''}
              ${u.personal ? `<p style="margin: 2px 0 0 0; color: #64748b; font-size: 11px;">Operador: ${u.personal.nombre} ${u.personal.apellido}</p>` : ''}
            </div>
          `;

          unitMarker.bindPopup(unitPopupHtml);
          unitMarker.addTo(markersLayer);
        });
      }

      // Ajustar vista a los límites si hay elementos
      if (bounds.length > 0 && !emergenciaSeleccionadaId) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }

    actualizarCapas();
  }, [mapaListo, emergencias, unidades, filtroCapa, emergenciaSeleccionadaId]);

  const centrarEnCartagena = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([10.4110, -75.5300], 13);
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100" style={{ height: altura }}>
      {/* Barra de Controles Flotante */}
      {mostrarControles && (
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-white/95 backdrop-blur-sm p-1.5 rounded-lg border border-slate-200 shadow-md">
          <button
            onClick={() => setFiltroCapa('todos')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              filtroCapa === 'todos' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({emergencias.length + unidades.length})
          </button>
          <button
            onClick={() => setFiltroCapa('emergencias')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              filtroCapa === 'emergencias' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Incidentes ({emergencias.length})
          </button>
          <button
            onClick={() => setFiltroCapa('unidades')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              filtroCapa === 'unidades' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Unidades ({unidades.length})
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button
            onClick={centrarEnCartagena}
            title="Centrar mapa en Cartagena de Indias"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
          >
            <Navigation className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Contenedor del Mapa Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Leyenda en la esquina inferior izquierda */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200 shadow-sm text-xs space-y-1">
        <p className="font-bold text-slate-700 text-[11px] mb-1">Leyenda Operativa:</p>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
          <span className="text-slate-600">Reportado / Pendiente</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
          <span className="text-slate-600">Clasificado (Triage)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" />
          <span className="text-slate-600">Unidad Despachada</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
          <span className="text-slate-600">🚑 Ambulancia / Patrulla</span>
        </div>
      </div>
    </div>
  );
}
