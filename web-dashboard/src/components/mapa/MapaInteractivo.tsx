'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Emergencia, EstadoEmergencia, Unidad, EstadoUnidad } from '@/types';
import { MapPin, Navigation, Eye, Layers, Filter, Radio, Truck, Activity } from 'lucide-react';
import { haversineKm, formatearDistancia, formatearETA, calcularETA } from '@/lib/geo';

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

type TipoCapaBase = 'calles' | 'nocturno' | 'satelite';

export default function MapaInteractivo({
  emergencias,
  unidades = [],
  centro = [10.411, -75.53], // Cartagena de Indias, Colombia
  zoom = 13,
  emergenciaSeleccionadaId,
  onSeleccionarEmergencia,
  altura = '500px',
  mostrarControles = true,
}: MapaInteractivoProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const baseTileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routesLayerRef = useRef<any>(null);

  const [filtroCapa, setFiltroCapa] = useState<'todos' | 'emergencias' | 'unidades'>('todos');
  const [capaBase, setCapaBase] = useState<TipoCapaBase>('calles');
  const [mapaListo, setMapaListo] = useState(false);

  // Inicialización del mapa Leaflet
  useEffect(() => {
    let map: any = null;

    async function initMap() {
      if (!mapContainerRef.current) return;
      const L = (await import('leaflet')).default;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      map = L.map(mapContainerRef.current, {
        center: centro,
        zoom,
        zoomControl: true,
      });

      // Capa base inicial (Calles OpenStreetMap)
      const tile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contribuyentes',
        maxZoom: 19,
      }).addTo(map);

      baseTileLayerRef.current = tile;
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

  // Cambio dinámico de capa base (Calles / Táctico Nocturno / Satélite)
  useEffect(() => {
    if (!mapaListo || !mapInstanceRef.current) return;

    async function cambiarCapaBase() {
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;

      if (baseTileLayerRef.current) {
        map.removeLayer(baseTileLayerRef.current);
      }

      let nuevaCapa: any;
      if (capaBase === 'nocturno') {
        nuevaCapa = L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          {
            attribution: '&copy; CartoDB Dark Matter · Sala de Crisis',
            maxZoom: 19,
          }
        );
      } else if (capaBase === 'satelite') {
        nuevaCapa = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: '&copy; Esri World Imagery',
            maxZoom: 18,
          }
        );
      } else {
        nuevaCapa = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contribuyentes',
          maxZoom: 19,
        });
      }

      nuevaCapa.addTo(map);
      baseTileLayerRef.current = nuevaCapa;
    }

    cambiarCapaBase();
  }, [capaBase, mapaListo]);

  // Actualizar marcadores y rutas vectoriales animadas
  useEffect(() => {
    if (!mapaListo || !mapInstanceRef.current) return;

    async function actualizarCapas() {
      const L = (await import('leaflet')).default;
      markersLayerRef.current.clearLayers();
      routesLayerRef.current.clearLayers();

      const bounds: [number, number][] = [];

      // 1. RENDERIZAR EMERGENCIAS
      if (filtroCapa === 'todos' || filtroCapa === 'emergencias') {
        emergencias.forEach((e) => {
          if (!e.latitud || !e.longitud) return;

          bounds.push([e.latitud, e.longitud]);

          const esCritico = e.prioridad === 1;
          const colorFondo =
            e.estado === EstadoEmergencia.REPORTADO
              ? '#f59e0b' // Ámbar
              : e.estado === EstadoEmergencia.CLASIFICADO
              ? '#2563eb' // Azul
              : e.estado === EstadoEmergencia.ASIGNADO
              ? '#9333ea' // Púrpura
              : e.estado === EstadoEmergencia.EN_ATENCION
              ? '#ea580c' // Naranja
              : '#16a34a'; // Verde

          const clasePulso = esCritico ? 'pulse-marker-critical' : '';
          const tamano = esCritico ? 34 : 28;

          const iconoHtml = `
            <div class="custom-emergency-marker ${clasePulso}" style="background-color: ${colorFondo}; width: ${tamano}px; height: ${tamano}px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: ${tamano > 30 ? '14px' : '11px'};">
              ${e.tipo_emergencia?.icono || '🚨'}
            </div>
          `;

          const customIcon = L.divIcon({
            html: iconoHtml,
            className: 'bg-transparent',
            iconSize: [tamano, tamano],
            iconAnchor: [tamano / 2, tamano / 2],
            popupAnchor: [0, -tamano / 2],
          });

          const popupContent = `
            <div style="font-family: inherit; min-width: 200px; padding: 2px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
                <strong style="color: #0f172a; font-family: monospace; font-size: 13px;">Incidente #${e.id}</strong>
                <span style="font-size: 10px; font-weight: bold; background: ${esCritico ? '#fee2e2' : '#f1f5f9'}; color: ${esCritico ? '#b91c1c' : '#475569'}; padding: 2px 6px; border-radius: 4px;">
                  P${e.prioridad} ${esCritico ? 'CRÍTICA' : ''}
                </span>
              </div>
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #334155; line-height: 1.4;">
                ${e.descripcion.length > 80 ? e.descripcion.substring(0, 80) + '...' : e.descripcion}
              </p>
              <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
                <strong>Estado:</strong> ${e.estado}
              </div>
              <a href="/dashboard/emergencias/${e.id}" style="display: block; text-align: center; background: #2563eb; color: white; padding: 6px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold;">
                Gestionar Incidente →
              </a>
            </div>
          `;

          const marker = L.marker([e.latitud, e.longitud], { icon: customIcon })
            .bindPopup(popupContent)
            .addTo(markersLayerRef.current);

          if (onSeleccionarEmergencia) {
            marker.on('click', () => onSeleccionarEmergencia(e.id));
          }
        });
      }

      // 2. RENDERIZAR UNIDADES Y RUTAS VECTORIALES
      if (filtroCapa === 'todos' || filtroCapa === 'unidades') {
        unidades.forEach((u) => {
          if (!u.latitud_actual || !u.longitud_actual) return;

          bounds.push([u.latitud_actual, u.longitud_actual]);

          const estaDespachada = u.estado === EstadoUnidad.DESPACHADA;
          const enEscena = u.estado === EstadoUnidad.EN_ESCENA;

          const iconoUnidadHtml = `
            <div style="background-color: ${enEscena ? '#16a34a' : estaDespachada ? '#9333ea' : '#1e40af'}; width: 32px; height: 32px; border-radius: 8px; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); color: white; font-size: 13px;">
              🚑
            </div>
          `;

          const unitIcon = L.divIcon({
            html: iconoUnidadHtml,
            className: 'bg-transparent',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          L.marker([u.latitud_actual, u.longitud_actual], { icon: unitIcon })
            .bindPopup(`
              <div style="font-size: 12px; min-width: 160px;">
                <strong style="color: #0f172a; font-family: monospace;">${u.codigo}</strong>
                <p style="margin: 2px 0; color: #475569;">${u.tipo}</p>
                <span style="display: inline-block; margin-top: 4px; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #dbeafe; color: #1e40af;">
                  ${u.estado}
                </span>
              </div>
            `)
            .addTo(markersLayerRef.current);

          // RUTA VECTORIAL ANIMADA: Si la unidad está asignada a un incidente activo
          const casoAsignado = emergencias.find(
            (e) => (e.id_unidad === u.id || e.unidad?.id === u.id) &&
              (e.estado === EstadoEmergencia.ASIGNADO || e.estado === EstadoEmergencia.EN_ATENCION)
          );

          if (casoAsignado && casoAsignado.latitud && casoAsignado.longitud) {
            const distKm = haversineKm(
              u.latitud_actual,
              u.longitud_actual,
              casoAsignado.latitud,
              casoAsignado.longitud
            );
            const etaMin = calcularETA(distKm);

            // Trazo animado (Polyline con destellos)
            const polyline = L.polyline(
              [
                [u.latitud_actual, u.longitud_actual],
                [casoAsignado.latitud, casoAsignado.longitud],
              ],
              {
                color: '#3b82f6',
                weight: 4,
                opacity: 0.85,
                dashArray: '10, 10',
              }
            ).addTo(routesLayerRef.current);

            // Midpoint para badge de distancia
            const midLat = (u.latitud_actual + casoAsignado.latitud) / 2;
            const midLng = (u.longitud_actual + casoAsignado.longitud) / 2;

            const badgeDistanciaHtml = `
              <div style="background: rgba(15, 23, 42, 0.9); color: #38bdf8; font-family: monospace; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; border: 1px solid #0284c7; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
                📍 ${formatearDistancia(distKm)} · ETA: ${formatearETA(etaMin)}
              </div>
            `;

            L.marker([midLat, midLng], {
              icon: L.divIcon({
                html: badgeDistanciaHtml,
                className: 'bg-transparent',
                iconAnchor: [40, 10],
              }),
            }).addTo(routesLayerRef.current);
          }
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
      mapInstanceRef.current.setView([10.411, -75.53], 13);
    }
  };

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900"
      style={{ height: altura }}
    >
      {/* Controles Flotantes Superiores */}
      {mostrarControles && (
        <div className="absolute top-3 right-3 z-[1000] flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-700 shadow-xl">
          {/* Selector de Capa Base (Calles / Nocturno / Satélite) */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded border border-slate-700">
            <button
              onClick={() => setCapaBase('calles')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors ${
                capaBase === 'calles'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Calles
            </button>
            <button
              onClick={() => setCapaBase('nocturno')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors ${
                capaBase === 'nocturno'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Táctico Dark
            </button>
            <button
              onClick={() => setCapaBase('satelite')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors ${
                capaBase === 'satelite'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Satélite
            </button>
          </div>

          <div className="w-px h-4 bg-slate-700 mx-1 hidden sm:block" />

          {/* Filtro de Elementos */}
          <button
            onClick={() => setFiltroCapa('todos')}
            className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
              filtroCapa === 'todos'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Todos ({emergencias.length + unidades.length})
          </button>
          <button
            onClick={() => setFiltroCapa('emergencias')}
            className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
              filtroCapa === 'emergencias'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Incidentes ({emergencias.length})
          </button>
          <button
            onClick={() => setFiltroCapa('unidades')}
            className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
              filtroCapa === 'unidades'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Flota ({unidades.length})
          </button>

          <button
            onClick={centrarEnCartagena}
            title="Centrar en Cartagena de Indias"
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
          >
            <Navigation className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Contenedor del Mapa Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Panel Táctico Inferior: Telemetría y Leyenda */}
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-2 pointer-events-none">
        {/* Telemetría del mapa */}
        <div className="bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700 shadow-xl pointer-events-auto text-[11px] font-mono text-slate-300 space-y-1">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1">
            <span className="font-bold text-emerald-400">RADAR TÁCTICO 123</span>
            <span className="text-slate-500">10.411°N, 75.530°W</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Incidentes: <strong className="text-white">{emergencias.length}</strong></span>
            <span>Unidades: <strong className="text-white">{unidades.length}</strong></span>
            <span className="text-emerald-400 font-bold">● VIGILANCIA ACTIVA</span>
          </div>
        </div>

        {/* Leyenda Operativa */}
        <div className="hidden sm:flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-300 pointer-events-auto">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Triage
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Despacho
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> En Ruta
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> Resuelto
          </span>
        </div>
      </div>
    </div>
  );
}
