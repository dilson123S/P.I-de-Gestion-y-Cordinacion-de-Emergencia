'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { CatalogoTipoEmergencia } from '@/types';
import { mockCatalogo } from '@/lib/mock-data';

export default function CatalogoPage() {
  const [catalogo, setCatalogo] = useState<CatalogoTipoEmergencia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const res = await api.get('/catalogo');
        if (res.data?.datos && res.data.datos.length > 0) {
          setCatalogo(res.data.datos);
        } else {
          setCatalogo(mockCatalogo);
        }
      } catch (err) {
        setCatalogo(mockCatalogo);
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catálogo de Tipos de Emergencia (RF-09)</h1>
          <p className="text-sm text-slate-500">
            Catálogos administrables para tipificación estandarizada y asignación de prioridades predeterminadas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-sm text-slate-500 col-span-3 text-center py-10">Cargando catálogo...</p>
        ) : catalogo.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-3xl">{item.icono || '🚨'}</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  item.prioridad_default === 1
                    ? 'bg-red-100 text-red-700'
                    : item.prioridad_default === 2
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                Prioridad Base: P{item.prioridad_default}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">{item.nombre}</h3>
            <p className="text-xs text-slate-500 font-mono">Código: {item.codigo}</p>
            <p className="text-xs text-slate-600">{item.descripcion || 'Sin descripción detallada'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
