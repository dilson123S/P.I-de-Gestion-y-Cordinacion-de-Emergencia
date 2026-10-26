'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Volume2, VolumeX, X, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/contexts/SocketContext';
import { useAlertSound } from '@/hooks/useAlertSound';
import { formatearRol, Emergencia } from '@/types';
import { api } from '@/lib/api';
import NotificacionesDropdown from '@/components/layout/NotificacionesDropdown';

/**
 * Encabezado institucional de la consola de mando SIGEM 123.
 * Diseño limpio, sobrio y de alta legibilidad con buscador global operativo.
 */
export default function Header() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { isConnected } = useSocket();
  const { isMuted, toggleMute } = useAlertSound();

  // Buscador operativo
  const [termino, setTermino] = useState('');
  const [resultados, setResultados] = useState<Emergencia[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    function handleClickAfuera(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuAbierto(false);
    }
    document.addEventListener('mousedown', handleClickAfuera);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Búsqueda reactiva con debounce
  useEffect(() => {
    if (!termino.trim()) {
      setResultados([]);
      setMenuAbierto(false);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const queryLimpia = termino.replace('#', '').trim();
        const res = await api.get('/emergencias?limite=30');
        const lista: Emergencia[] = res.data?.datos?.emergencias || [];

        const filtradas = lista.filter((e) => {
          const coincideId = e.id.toString() === queryLimpia;
          const coincideTexto =
            (e.descripcion && e.descripcion.toLowerCase().includes(termino.toLowerCase())) ||
            (e.tipo_emergencia?.nombre && e.tipo_emergencia.nombre.toLowerCase().includes(termino.toLowerCase()));
          return coincideId || coincideTexto;
        });

        setResultados(filtradas.slice(0, 6));
        setMenuAbierto(true);
      } catch {
        setResultados([]);
      } finally {
        setBuscando(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [termino]);

  const handleSeleccionarCaso = (id: number) => {
    setTermino('');
    setMenuAbierto(false);
    router.push(`/dashboard/emergencias/${id}`);
  };

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const idLimpio = termino.replace('#', '').trim();
      if (/^\d+$/.test(idLimpio)) {
        handleSeleccionarCaso(parseInt(idLimpio, 10));
      } else if (resultados.length > 0) {
        handleSeleccionarCaso(resultados[0].id);
      }
    }
  };

  return (
    <header className="sticky top-0 z-20 !flex flex-row flex-nowrap h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm no-print">
      {/* SECCIÓN IZQUIERDA: Barra de búsqueda institucional interactiva */}
      <div className="flex items-center flex-1 max-w-md min-w-[240px] relative" ref={searchRef}>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            onKeyDown={handleKeyDownInput}
            onFocus={() => {
              if (resultados.length > 0) setMenuAbierto(true);
            }}
            placeholder="Buscar por código (ej. #1), dirección o tipo..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium transition-all"
          />

          {buscando ? (
            <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-blue-600 animate-spin" />
          ) : termino ? (
            <button
              onClick={() => {
                setTermino('');
                setMenuAbierto(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {/* Dropdown de Resultados de Búsqueda */}
        {menuAbierto && (
          <div className="absolute left-0 top-full mt-2 w-full rounded-xl bg-white shadow-xl border border-slate-200 z-50 overflow-hidden ring-1 ring-black/5">
            <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Resultados para "{termino}"</span>
              <span className="font-mono text-[10px]">Presiona Enter para abrir</span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {resultados.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-1 opacity-70" />
                  No se encontraron incidentes que coincidan
                </div>
              ) : (
                resultados.map((caso) => (
                  <div
                    key={caso.id}
                    onClick={() => handleSeleccionarCaso(caso.id)}
                    className="p-3 hover:bg-blue-50/60 cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono font-bold text-blue-700">#{caso.id}</span>
                        <span className="font-semibold text-slate-800 truncate">
                          {caso.tipo_emergencia?.nombre || 'Incidente General'}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            caso.estado === 'REPORTADO'
                              ? 'bg-amber-100 text-amber-800'
                              : caso.estado === 'CLASIFICADO'
                              ? 'bg-purple-100 text-purple-800'
                              : caso.estado === 'ASIGNADO'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {caso.estado}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {caso.descripcion || 'Sin descripción detallada'}
                      </p>
                    </div>

                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN DERECHA: Esquina superior derecha (Telemetría, Audio, Notificaciones y Perfil) */}
      <div className="flex items-center gap-3.5 ml-auto flex-shrink-0">
        {/* Telemetría: Estado de Enlace WebSocket */}
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className={isConnected ? 'text-slate-700 font-medium' : 'text-red-700 font-medium'}>
            {isConnected ? 'Enlace 123 en línea' : 'Sin conexión'}
          </span>
        </div>

        {/* Conmutador de Audio Alertas */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Activar alertas acústicas' : 'Silenciar alertas acústicas'}
          className={`rounded-lg p-2 text-xs transition-colors border ${
            isMuted
              ? 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        {/* Centro de Notificaciones Operativas Interactivo */}
        <NotificacionesDropdown />

        {/* Separador vertical */}
        <div className="hidden sm:block h-6 w-px bg-slate-200" />

        {/* Usuario y rol perfectamente anclados a la derecha */}
        {usuario && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right lg:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {usuario.nombre} {usuario.apellido}
              </p>
              <p className="text-[10px] font-semibold text-blue-700 tracking-tight">
                {formatearRol(usuario.rol)}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm border border-blue-700 font-mono">
              {usuario.nombre.charAt(0)}
              {usuario.apellido.charAt(0)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
