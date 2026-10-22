'use client';

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { CatalogoTipoEmergencia } from '@/types';

interface ClasificarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { id_tipo_emergencia: number; prioridad: number; notas_clasificacion?: string }) => Promise<void>;
  tiposCatalogo: CatalogoTipoEmergencia[];
}

export default function ClasificarModal({ isOpen, onClose, onConfirm, tiposCatalogo }: ClasificarModalProps) {
  const [tipoId, setTipoId] = useState<string>('');
  const [prioridad, setPrioridad] = useState<string>('3');
  const [notas, setNotas] = useState<string>('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoId) return;

    setCargando(true);
    try {
      await onConfirm({
        id_tipo_emergencia: parseInt(tipoId, 10),
        prioridad: parseInt(prioridad, 10),
        notas_clasificacion: notas,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Clasificar Emergencia (RF-03)">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Emergencia</label>
          <select
            value={tipoId}
            onChange={(e) => {
              setTipoId(e.target.value);
              const seleccionado = tiposCatalogo.find((t) => t.id === parseInt(e.target.value, 10));
              if (seleccionado) setPrioridad(seleccionado.prioridad_default.toString());
            }}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">-- Seleccionar tipo --</option>
            {tiposCatalogo.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icono} {t.nombre} (Prioridad sugerida: {t.prioridad_default})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad (1=Crítica, 5=Baja)</label>
          <select
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="1">1 - Crítica (Riesgo inminente de vida)</option>
            <option value="2">2 - Alta (Urgencia mayor)</option>
            <option value="3">3 - Media (Requiere despacho rápido)</option>
            <option value="4">4 - Moderada</option>
            <option value="5">5 - Baja</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notas de Clasificación del Operador</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            placeholder="Observaciones de triage o validación telefónica..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={cargando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!tipoId || cargando}>
            {cargando ? 'Guardando...' : 'Confirmar Clasificación'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
