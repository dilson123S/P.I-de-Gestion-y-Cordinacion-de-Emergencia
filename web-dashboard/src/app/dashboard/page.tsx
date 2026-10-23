'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  Map as MapIcon,
  List,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import EstadoBadge from '@/components/emergencias/EstadoBadge';
import { api } from '@/lib/api';
import { Emergencia, EstadoEmergencia, Unidad } from '@/types';
import { mockEmergencias, mockUnidades } from '@/lib/mock-data';

const MapaInteractivo = dynamic(() => import('@/components/mapa/MapaInteractivo'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-slate-100 flex items-center justify-center rounded-xl border border-slate-200">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-2" />
    </div>
  ),
});

export default function DashboardPage() {
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>(mockUnidades);
  const [vista, setVista] = useState<'mapa' | 'tabla'>('mapa');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [resEme, resUni] = await Promise.allSettled([
          api.get('/emergencias?limite=10'),
          api.get('/unidades'),
        ]);

        if (resEme.status === 'fulfilled' && resEme.value.data?.datos?.emergencias?.length > 0) {
          setEmergencias(resEme.value.data.datos.emergencias);
        } else {
          setEmergencias(mockEmergencias);
        }

        if (resUni.status === 'fulfilled' && resUni.value.data?.datos?.length > 0) {
          setUnidades(resUni.value.data.datos);
        } else {
          setUnidades(mockUnidades);
        }
      } catch (err) {
        setEmergencias(mockEmergencias);
        setUnidades(mockUnidades);
      } finally {
        setLoading(false);
      }
    }
    cargarDatos();
  }, []);

  const totalReportadas = emergencias.filter((e) => e.estado === EstadoEmergencia.REPORTADO).length;
  const totalClasificadas = emergencias.filter((e) => e.estado === EstadoEmergencia.CLASIFICADO).length;
  const totalEnAtencion = emergencias.filter(
    (e) => e.estado === EstadoEmergencia.EN_ATENCION || e.estado === EstadoEmergencia.ASIGNADO
  ).length;
  const totalCerradas = emergencias.filter((e) => e.estado === EstadoEmergencia.CERRADO).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Centro de Comando y Despacho</h1>
          <p className="text-sm text-slate-500">
            Vista unificada del ciclo de vida de emergencias en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/mapa">
            <Button variant="outline" className="flex items-center gap-2">
              <MapIcon className="h-4 w-4 text-blue-600" /> Ver Mapa Completo
            </Button>
          </Link>
          <Link href="/dashboard/emergencias">
            <Button className="flex items-center gap-2">
              Bandeja de Casos <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas Operativas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-800">Pendientes de Triage</p>
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-amber-950">{totalReportadas}</p>
          <p className="text-xs text-amber-700 mt-1">Estado: REPORTADO (RF-01)</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-800">Listas para Despacho</p>
            <AlertTriangle className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-blue-950">{totalClasificadas}</p>
          <p className="text-xs text-blue-700 mt-1">Estado: CLASIFICADO (RF-03)</p>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-purple-800">Unidades en Campo</p>
            <Truck className="h-5 w-5 text-purple-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-purple-950">{totalEnAtencion}</p>
          <p className="text-xs text-purple-700 mt-1">ASIGNADO / EN_ATENCION</p>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-800">Casos Resueltos</p>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-green-950">{totalCerradas}</p>
          <p className="text-xs text-green-700 mt-1">Estado: CERRADO con resolución</p>
        </div>
      </div>

      {/* Selector de Vista: Mapa vs Tabla */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Incidentes y Recursos Activos</h2>
            <p className="text-xs text-slate-500">Distribución geográfica y cola de atención</p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setVista('mapa')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                vista === 'mapa' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" /> Mapa en Vivo
            </button>
            <button
              onClick={() => setVista('tabla')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                vista === 'tabla' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" /> Tabla Resumen
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 py-10 text-center">Cargando datos...</p>
        ) : vista === 'mapa' ? (
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <MapaInteractivo
              emergencias={emergencias}
              unidades={unidades}
              altura="450px"
              mostrarControles={true}
            />
          </div>
        ) : emergencias.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium">No hay emergencias registradas actualmente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Prioridad</th>
                  <th className="px-4 py-3">Ciudadano</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emergencias.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">#{e.id}</td>
                    <td className="px-4 py-3">
                      {e.tipo_emergencia ? (
                        <span>
                          {e.tipo_emergencia.icono} {e.tipo_emergencia.nombre}
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400">Sin clasificar</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-700">{e.descripcion}</td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={e.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          e.prioridad === 1
                            ? 'bg-red-100 text-red-700'
                            : e.prioridad === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        P{e.prioridad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {e.ciudadano ? `${e.ciudadano.nombre} ${e.ciudadano.apellido}` : 'Ciudadano'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(e.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/emergencias/${e.id}`}>
                        <Button variant="outline" size="sm">
                          Gestionar
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
