'use client';

import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Unidad } from '@/types';
import { haversineKm, formatearDistancia, formatearETA, calcularETA } from '@/lib/geo';
import { Truck, Navigation, Clock, User, CheckCircle2, Shield, Phone } from 'lucide-react';

interface AsignarUnidadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { id_unidad: number; notas_despacho?: string }) => Promise<void>;
  unidadesDisponibles: Unidad[];
  emergenciaLatitud?: number;
  emergenciaLongitud?: number;
}

export default function AsignarUnidadModal({
  isOpen,
  onClose,
  onConfirm,
  unidadesDisponibles,
  emergenciaLatitud,
  emergenciaLongitud,
}: AsignarUnidadModalProps) {
  const [unidadId, setUnidadId] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [cargando, setCargando] = useState(false);

  // Ordenar unidades por proximidad geográfica si hay coordenadas disponibles
  const unidadesOrdenadas = useMemo(() => {
    return [...unidadesDisponibles]
      .map((u) => {
        let distanciaKm = 0;
        let etaMin = 0;
        if (emergenciaLatitud && emergenciaLongitud && u.latitud_actual && u.longitud_actual) {
          distanciaKm = haversineKm(
            u.latitud_actual,
            u.longitud_actual,
            emergenciaLatitud,
            emergenciaLongitud
          );
          etaMin = calcularETA(distanciaKm);
        }
        return {
          ...u,
          distanciaKm,
          etaMin,
        };
      })
      .sort((a, b) => (a.distanciaKm || 999) - (b.distanciaKm || 999));
  }, [unidadesDisponibles, emergenciaLatitud, emergenciaLongitud]);

  const unidadSeleccionada = useMemo(() => {
    if (!unidadId) return null;
    return unidadesOrdenadas.find((u) => u.id === parseInt(unidadId, 10)) || null;
  }, [unidadId, unidadesOrdenadas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unidadId) return;

    setCargando(true);
    try {
      await onConfirm({
        id_unidad: parseInt(unidadId, 10),
        notas_despacho: notas,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mando y Despacho Táctico: Asignación de Unidad (RF-05)">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Seleccionar Personal y Unidad Disponible por Proximidad
          </label>
          <select
            value={unidadId}
            onChange={(e) => setUnidadId(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
          >
            <option value="">-- Seleccionar personal de campo en servicio --</option>
            {unidadesOrdenadas.map((u, index) => {
              const tieneCoords = u.latitud_actual && u.longitud_actual;
              const nombrePersonal = u.personal
                ? `${u.personal.nombre} ${u.personal.apellido}`
                : 'Unidad sin personal vinculado';
              return (
                <option key={u.id} value={u.id}>
                  [{u.codigo}] · {nombrePersonal} ({u.tipo}) {tieneCoords ? `· 📍 ${formatearDistancia(u.distanciaKm)} (ETA: ~${formatearETA(u.etaMin)})` : ''} {index === 0 && tieneCoords ? '⭐ MÁS CERCANA' : ''}
                </option>
              );
            })}
          </select>

          {unidadesDisponibles.length === 0 && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <p className="font-bold">⚠️ No hay unidades tácticas en estado DISPONIBLE.</p>
              <p className="mt-0.5 text-[11px] text-amber-700">
                Las unidades que están actualmente en despacho o atención deben reportar el cierre de su misión en su App Móvil para volver a estar disponibles, o pueden ser habilitadas en el panel de Unidades.
              </p>
            </div>
          )}
        </div>

        {/* Ficha institucional del operador y unidad seleccionada */}
        {unidadSeleccionada && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-2.5 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">[{unidadSeleccionada.codigo}]</span>
                    <span className="text-slate-600 font-medium">{unidadSeleccionada.tipo}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Placa Oficial: {unidadSeleccionada.placa || 'En asignación'}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" /> DISPONIBLE
              </span>
            </div>

            {/* Operador de campo a cargo */}
            <div className="flex items-center justify-between text-slate-700 pt-1">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-blue-700" />
                <span className="font-semibold text-slate-600">Personal de Campo Asignado:</span>
                <span className="font-bold text-slate-900">
                  {unidadSeleccionada.personal
                    ? `${unidadSeleccionada.personal.nombre} ${unidadSeleccionada.personal.apellido}`
                    : 'Personal de Reserva'}
                </span>
              </div>
              {unidadSeleccionada.personal?.telefono && (
                <span className="flex items-center gap-1 text-slate-600 font-mono text-[11px]">
                  <Phone className="h-3 w-3 text-slate-400" />
                  {unidadSeleccionada.personal.telefono}
                </span>
              )}
            </div>

            {/* Proximidad y tiempo estimado */}
            {unidadSeleccionada.latitud_actual && (
              <div className="flex items-center justify-between text-[11px] bg-white/70 p-2 rounded-lg border border-blue-100 font-medium text-slate-600">
                <span className="flex items-center gap-1">
                  <Navigation className="h-3.5 w-3.5 text-blue-600" />
                  Distancia a escena: <strong className="text-slate-900 font-mono">{formatearDistancia(unidadSeleccionada.distanciaKm)}</strong>
                </span>
                <span className="flex items-center gap-1 font-mono text-blue-700">
                  <Clock className="h-3.5 w-3.5" />
                  ETA aproximado: <strong>~{formatearETA(unidadSeleccionada.etaMin)}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Instrucciones y Orden de Despacho Táctico
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            placeholder="Ejemplo: Proceder por Av. Pedro de Heredia. Tráfico moderado. Oficial debe coordinar acordonamiento a su llegada."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={cargando} className="text-xs">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!unidadId || cargando}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
          >
            <Truck className="h-3.5 w-3.5" />
            {cargando ? 'Transmitiendo orden...' : 'Confirmar y Despachar Unidad'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
