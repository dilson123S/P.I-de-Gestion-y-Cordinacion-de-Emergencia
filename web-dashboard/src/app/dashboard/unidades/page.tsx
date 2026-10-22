'use client';

import React, { useEffect, useState } from 'react';
import { Truck, MapPin, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { Unidad, EstadoUnidad } from '@/types';

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarUnidades = async () => {
    setLoading(true);
    try {
      const res = await api.get('/unidades');
      if (res.data?.datos) {
        setUnidades(res.data.datos);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUnidades();
  }, []);

  const badgeVariant = (estado: EstadoUnidad) => {
    switch (estado) {
      case EstadoUnidad.DISPONIBLE:
        return 'success';
      case EstadoUnidad.DESPACHADA:
        return 'primary';
      case EstadoUnidad.EN_ESCENA:
        return 'warning';
      default:
        return 'danger';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Unidades de Emergencia</h1>
          <p className="text-sm text-slate-500">
            Control de flota, disponibilidad y personal asignado en campo
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={cargarUnidades} className="flex items-center gap-1">
          <RefreshCw className="h-4 w-4" /> Refrescar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-sm text-slate-500 col-span-3 text-center py-10">Cargando unidades...</p>
        ) : unidades.map((u) => (
          <div key={u.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{u.codigo}</h3>
                  <p className="text-xs text-slate-500">{u.tipo} {u.placa ? `• ${u.placa}` : ''}</p>
                </div>
              </div>
              <Badge variant={badgeVariant(u.estado)}>
                {u.estado}
              </Badge>
            </div>

            <div className="border-t border-slate-100 pt-3 text-xs space-y-1 text-slate-600">
              <p className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  {u.latitud_actual && u.longitud_actual
                    ? `${u.latitud_actual.toFixed(4)}, ${u.longitud_actual.toFixed(4)}`
                    : 'Sin geolocalización'}
                </span>
              </p>
              {u.personal && (
                <p className="text-slate-700">
                  Operador a cargo: <span className="font-medium">{u.personal.nombre} {u.personal.apellido}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
