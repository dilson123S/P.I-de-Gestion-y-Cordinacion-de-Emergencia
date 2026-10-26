'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  X,
  AlertTriangle,
  Radio,
  CheckCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useNotifications, Notificacion } from '@/contexts/NotificationsContext';

/**
 * Formatea una fecha ISO a tiempo relativo legible en español
 */
function formatearTiempoRelativo(fechaIso: string): string {
  try {
    const diffMs = Date.now() - new Date(fechaIso).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHrs / 24);

    if (diffSec < 45) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHrs < 24) return `Hace ${diffHrs} h`;
    return `Hace ${diffDias} d`;
  } catch {
    return 'Reciente';
  }
}

export default function NotificacionesDropdown() {
  const router = useRouter();
  const {
    notificaciones,
    noLeidasCount,
    criticasCount,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    agregarNotificacion,
  } = useNotifications();

  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState<'todas' | 'no_leidas' | 'criticas'>('todas');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickAfuera(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAbierto(false);
      }
    }

    if (abierto) {
      document.addEventListener('mousedown', handleClickAfuera);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [abierto]);

  // Filtrado de elementos
  const itemsFiltrados = notificaciones.filter((n) => {
    if (filtro === 'no_leidas') return !n.leida;
    if (filtro === 'criticas') return n.tipo === 'critica';
    return true;
  });

  const handleItemClick = (n: Notificacion) => {
    marcarComoLeida(n.id);
    if (n.enlace) {
      router.push(n.enlace);
      setAbierto(false);
    }
  };

  const handleSimularAlerta = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idCaso = Math.floor(100 + Math.random() * 900);
    agregarNotificacion({
      titulo: `🚨 Nueva Alerta SOS #${idCaso}`,
      mensaje: `Reporte de emergencia ciudadana en tiempo real. Triage de alta prioridad asignado.`,
      tipo: 'critica',
      enlace: `/dashboard/emergencias`,
      casoId: idCaso,
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de la Campana */}
      <button
        onClick={() => setAbierto(!abierto)}
        title="Centro de notificaciones operativas"
        aria-label="Notificaciones"
        aria-expanded={abierto}
        className={`relative rounded-lg p-2 transition-all border ${
          abierto
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 border-transparent'
        }`}
      >
        <Bell className="h-4 w-4" />

        {/* Insignia animada si hay alertas críticas */}
        {criticasCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          </span>
        )}

        {/* Contador numérico de no leídas */}
        {noLeidasCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm font-mono leading-none">
            {noLeidasCount > 9 ? '9+' : noLeidasCount}
          </span>
        )}
      </button>

      {/* Menú Desplegable / Panel Flotante */}
      {abierto && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden ring-1 ring-black/5 animate-fade-up">
          {/* Encabezado del Panel */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <BellRing className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 leading-tight">
                  Centro de Notificaciones
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  Eventos y despacho en tiempo real
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {noLeidasCount > 0 && (
                <button
                  onClick={marcarTodasComoLeidas}
                  title="Marcar todas como leídas"
                  className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Leídas</span>
                </button>
              )}
              <button
                onClick={() => setAbierto(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Selector de Pestañas de Filtro */}
          <div className="flex border-b border-slate-100 bg-white px-2 pt-1 gap-1">
            <button
              onClick={() => setFiltro('todas')}
              className={`flex-1 py-1.5 text-[11px] font-semibold border-b-2 transition-all ${
                filtro === 'todas'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Todas ({notificaciones.length})
            </button>
            <button
              onClick={() => setFiltro('no_leidas')}
              className={`flex-1 py-1.5 text-[11px] font-semibold border-b-2 transition-all ${
                filtro === 'no_leidas'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              No leídas ({noLeidasCount})
            </button>
            <button
              onClick={() => setFiltro('criticas')}
              className={`flex-1 py-1.5 text-[11px] font-semibold border-b-2 transition-all ${
                filtro === 'criticas'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Críticas ({criticasCount})
            </button>
          </div>

          {/* Lista de Notificaciones */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {itemsFiltrados.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-700">Sin notificaciones pendientes</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No hay eventos registrados en este filtro operativo.
                </p>
              </div>
            ) : (
              itemsFiltrados.map((n) => {
                const esCritica = n.tipo === 'critica';
                const esExito = n.tipo === 'exito';
                const esAlerta = n.tipo === 'alerta';

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3 transition-colors cursor-pointer relative group flex items-start gap-3 ${
                      !n.leida
                        ? esCritica
                          ? 'bg-red-50/40 hover:bg-red-50/70'
                          : 'bg-blue-50/30 hover:bg-blue-50/60'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Indicador de punto no leído */}
                    {!n.leida && (
                      <span
                        className={`absolute left-1.5 top-4 h-2 w-2 rounded-full ${
                          esCritica ? 'bg-red-500' : 'bg-blue-600'
                        }`}
                      />
                    )}

                    {/* Ícono de Estado */}
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                        esCritica
                          ? 'bg-red-100 text-red-700'
                          : esExito
                            ? 'bg-emerald-100 text-emerald-700'
                            : esAlerta
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {esCritica ? (
                        <ShieldAlert className="h-4 w-4" />
                      ) : esExito ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : esAlerta ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Radio className="h-4 w-4" />
                      )}
                    </div>

                    {/* Detalle del Mensaje */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p
                          className={`text-xs font-bold truncate ${
                            !n.leida
                              ? esCritica
                                ? 'text-red-900 font-extrabold'
                                : 'text-slate-900 font-bold'
                              : 'text-slate-700'
                          }`}
                        >
                          {n.titulo}
                        </p>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {n.mensaje}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-medium">
                        <Clock className="h-3 w-3" />
                        <span>{formatearTiempoRelativo(n.fecha)}</span>
                        {n.enlace && (
                          <span className="flex items-center gap-0.5 text-blue-600 font-semibold hover:underline ml-auto">
                            Ver caso <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botón descartar individual */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarNotificacion(n.id);
                      }}
                      title="Descartar notificación"
                      className="absolute right-2 top-2 p-1 rounded text-slate-300 hover:text-slate-500 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Pie del Panel */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={handleSimularAlerta}
              className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100/50 transition-colors"
            >
              + Simular Evento SOS
            </button>

            <button
              onClick={() => {
                router.push('/dashboard/emergencias');
                setAbierto(false);
              }}
              className="text-[11px] font-bold text-slate-700 hover:text-blue-700 transition-colors"
            >
              Ver todas las emergencias &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
