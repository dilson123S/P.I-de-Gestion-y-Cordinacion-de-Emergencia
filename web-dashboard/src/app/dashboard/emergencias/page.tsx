'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Eye, PhoneCall, Radio, ListFilter } from 'lucide-react';
import Button from '@/components/ui/Button';
import EstadoBadge from '@/components/emergencias/EstadoBadge';
import { api } from '@/lib/api';
import { Emergencia } from '@/types';
import { mockEmergencias } from '@/lib/mock-data';

export default function EmergenciasPage() {
  const searchParams = useSearchParams();
  const estadoInicial = searchParams?.get('estado') || '';

  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [estadoFiltro, setEstadoFiltro] = useState<string>(estadoInicial);
  const [prioridadFiltro, setPrioridadFiltro] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Sincronizar si cambia el parámetro de búsqueda en URL
  useEffect(() => {
    const estadoEnUrl = searchParams?.get('estado') || '';
    setEstadoFiltro(estadoEnUrl);
  }, [searchParams]);

  useEffect(() => {
    async function cargarEmergencias() {
      setLoading(true);
      try {
        let url = '/emergencias?limite=50';
        if (estadoFiltro) url += `&estado=${estadoFiltro}`;
        if (prioridadFiltro) url += `&prioridad=${prioridadFiltro}`;

        const res = await api.get(url);
        if (res.data?.datos?.emergencias && res.data.datos.emergencias.length > 0) {
          setEmergencias(res.data.datos.emergencias);
        } else {
          setEmergencias(mockEmergencias);
        }
      } catch {
        setEmergencias(mockEmergencias);
      } finally {
        setLoading(false);
      }
    }
    cargarEmergencias();
  }, [estadoFiltro, prioridadFiltro]);

  const filtradas = emergencias.filter((e) => {
    if (estadoFiltro && e.estado !== estadoFiltro) return false;
    if (prioridadFiltro && e.prioridad.toString() !== prioridadFiltro) return false;
    if (!busqueda) return true;
    const desc = e.descripcion?.toLowerCase() || '';
    const tipo = e.tipo_emergencia?.nombre?.toLowerCase() || '';
    const id = e.id.toString();
    const q = busqueda.toLowerCase();
    return desc.includes(q) || tipo.includes(q) || id.includes(q);
  });

  // Título contextual según el estado activo
  const contexto =
    estadoFiltro === 'REPORTADO'
      ? {
          titulo: 'Mesa de Triage: Incidentes por Validar',
          subtitulo: 'Cola de atención telefónica/ciudadana. Valide y clasifique cada alerta entrante (RF-03).',
          icono: PhoneCall,
          color: 'text-amber-700 bg-amber-50 border-amber-200',
        }
      : estadoFiltro === 'CLASIFICADO'
      ? {
          titulo: 'Mesa de Despacho: Incidentes por Asignar',
          subtitulo: 'Incidentes tipificados en espera de asignación de ambulancias, bomberos o patrullas (RF-05).',
          icono: Radio,
          color: 'text-purple-700 bg-purple-50 border-purple-200',
        }
      : {
          titulo: 'Registro General de Incidentes',
          subtitulo: 'Trazabilidad completa: Reportado → Clasificado → Asignado → En Atención → Cerrado.',
          icono: ListFilter,
          color: 'text-slate-800 bg-slate-50 border-slate-200',
        };

  const IconoContexto = contexto.icono;

  return (
    <div className="space-y-6">
      {/* Encabezado Contextual Institucional */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg border ${contexto.color} mt-1`}>
            <IconoContexto className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{contexto.titulo}</h1>
            <p className="text-sm text-slate-600 mt-0.5">{contexto.subtitulo}</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros Operativos */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por ID, descripción o tipo de incidente..."
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium"
          />
        </div>

        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium focus:border-blue-500 focus:outline-none"
        >
          <option value="">Todos los Estados</option>
          <option value="REPORTADO">REPORTADO (Triage pendiente)</option>
          <option value="CLASIFICADO">CLASIFICADO (Listo para despacho)</option>
          <option value="ASIGNADO">ASIGNADO (Unidad en camino)</option>
          <option value="EN_ATENCION">EN ATENCIÓN (En escena)</option>
          <option value="CERRADO">CERRADO (Resuelto)</option>
        </select>

        <select
          value={prioridadFiltro}
          onChange={(e) => setPrioridadFiltro(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium focus:border-blue-500 focus:outline-none"
        >
          <option value="">Todas las Prioridades</option>
          <option value="1">P1 - Crítica</option>
          <option value="2">P2 - Alta</option>
          <option value="3">P3 - Media</option>
          <option value="4">P4 - Baja</option>
        </select>

        {(estadoFiltro || prioridadFiltro || busqueda) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEstadoFiltro('');
              setPrioridadFiltro('');
              setBusqueda('');
            }}
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Tabla Principal de Incidentes */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Cargando registros operativos...</div>
        ) : filtradas.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No se encontraron incidentes con los criterios de filtrado seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Tipo de Incidente</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Prioridad</th>
                  <th className="px-4 py-3">Unidad Asignada</th>
                  <th className="px-4 py-3">Hora Registro</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtradas.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">#{e.id}</td>
                    <td className="px-4 py-3 font-medium text-xs">
                      {e.tipo_emergencia ? (
                        <span>
                          {e.tipo_emergencia.icono} {e.tipo_emergencia.nombre}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Sin clasificar</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-sm truncate text-slate-700 text-xs">{e.descripcion}</td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={e.estado} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold ${
                          e.prioridad === 1
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : e.prioridad === 2
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        P{e.prioridad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {e.unidad ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-800">
                          🚑 {e.unidad.codigo}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Pendiente</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                      {new Date(e.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/emergencias/${e.id}`}>
                        <Button variant="outline" size="sm" className="inline-flex items-center gap-1 text-xs">
                          <Eye className="h-3.5 w-3.5" /> Gestionar
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
