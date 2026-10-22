'use client';

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Unidad } from '@/types';

interface AsignarUnidadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { id_unidad: number; notas_despacho?: string }) => Promise<void>;
  unidadesDisponibles: Unidad[];
}

export default function AsignarUnidadModal({
  isOpen,
  onClose,
  onConfirm,
  unidadesDisponibles,
}: AsignarUnidadModalProps) {
  const [unidadId, setUnidadId] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [cargando, setCargando] = useState(false);

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
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar Unidad de Respuesta (RF-05)">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Seleccionar Unidad Disponible
          </label>
          <select
            value={unidadId}
            onChange={(e) => setUnidadId(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">-- Seleccionar unidad en servicio --</option>
            {unidadesDisponibles.map((u) => (
              <option key={u.id} value={u.id}>
                [{u.codigo}] - {u.tipo} {u.placa ? `(Placa: ${u.placa})` : ''}
              </option>
            ))}
          </select>
          {unidadesDisponibles.length === 0 && (
            <p className="text-xs text-red-500 mt-1">No hay unidades actualmente en estado DISPONIBLE.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Instrucciones de Despacho</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            placeholder="Ruta sugerida, equipo médico especial, advertencias..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={cargando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!unidadId || cargando}>
            {cargando ? 'Despachando...' : 'Confirmar Despacho'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
