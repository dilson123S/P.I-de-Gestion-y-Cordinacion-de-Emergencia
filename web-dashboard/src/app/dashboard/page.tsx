'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  PhoneCall,
  Radio,
  Shield,
  Smartphone,
  ExternalLink,
  Eye,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import EstadoBadge from '@/components/emergencias/EstadoBadge';
import { api } from '@/lib/api';
import { Emergencia, EstadoEmergencia, Unidad, EstadoUnidad, formatearRol, RolUsuario } from '@/types';
import { mockEmergencias, mockUnidades } from '@/lib/mock-data';
import { useAuth } from '@/hooks/useAuth';

const MapaInteractivo = dynamic(() => import('@/components/mapa/MapaInteractivo'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] bg-slate-100 flex items-center justify-center rounded-xl border border-slate-200">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  ),
});

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>(mockUnidades);
  const [vista, setVista] = useState<'mapa' | 'tabla'>('mapa');
  const [tabOperativa, setTabOperativa] = useState<'TODAS' | 'TRIAGE' | 'DESPACHO' | 'ATENCION'>('TODAS');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [resEme, resUni] = await Promise.allSettled([
          api.get('/emergencias?limite=50'),
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
      } catch {
        setEmergencias(mockEmergencias);
        setUnidades(mockUnidades);
      } finally {
        setLoading(false);
      }
    }
    cargarDatos();
  }, []);

  const rol = String(usuario?.rol || 'OPERADOR_INTEGRAL');
  const esPersonalCampo = rol === 'PERSONAL_CAMPO';
  const esAdmin = rol === 'ADMIN' || rol === RolUsuario.ADMIN;
  // En la App Web solo operan dos roles: Administrador y Operador Integral
  const esOperadorIntegral = !esAdmin && !esPersonalCampo;

  // Métricas agregadas del ciclo de vida
  const totalReportadas = useMemo(
    () => emergencias.filter((e) => e.estado === EstadoEmergencia.REPORTADO).length,
    [emergencias]
  );
  const totalClasificadas = useMemo(
    () => emergencias.filter((e) => e.estado === EstadoEmergencia.CLASIFICADO).length,
    [emergencias]
  );
  const totalEnAtencion = useMemo(
    () =>
      emergencias.filter(
        (e) => e.estado === EstadoEmergencia.EN_ATENCION || e.estado === EstadoEmergencia.ASIGNADO
      ).length,
    [emergencias]
  );
  const totalCerradas = useMemo(
    () => emergencias.filter((e) => e.estado === EstadoEmergencia.CERRADO).length,
    [emergencias]
  );

  const unidadesDisponibles = useMemo(
    () => unidades.filter((u) => u.estado === EstadoUnidad.DISPONIBLE).length,
    [unidades]
  );

  // Unidad asignada a este usuario si es personal de campo
  const miUnidad = useMemo(() => {
    if (!usuario) return null;
    return unidades.find((u) => (u as any).id_personal === usuario.id) || unidades[0];
  }, [unidades, usuario]);

  // Emergencia activa asignada a la unidad del usuario
  const miMisionActiva = useMemo(() => {
    if (!miUnidad) return null;
    return emergencias.find(
      (e) =>
        (e.id_unidad === miUnidad.id || e.unidad?.id === miUnidad.id) &&
        (e.estado === EstadoEmergencia.ASIGNADO || e.estado === EstadoEmergencia.EN_ATENCION)
    );
  }, [emergencias, miUnidad]);

  /* ─────────────────────────────────────────────────────────────────
   * 1. VISTA ESPECIALIZADA: PERSONAL DE CAMPO (Terminal de Unidad)
   * ───────────────────────────────────────────────────────────────── */
  if (esPersonalCampo) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 border border-blue-200">
                Unidad de Respuesta
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Terminal de Operación en Campo</h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Puesto móvil del personal operativo: recepción de misiones, reporte de arribo y cierre de escena.
            </p>
          </div>
        </div>

        {/* Tarjeta de Estado del Vehículo / Unidad */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unidad Vinculada</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{miUnidad?.codigo || 'AMB-01'}</p>
                <p className="text-xs text-slate-500">{miUnidad?.tipo || 'Unidad de Respuesta'}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Placa: <strong className="text-slate-800">{miUnidad?.placa || 'OFICIAL'}</strong></span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-800">
                {miUnidad?.estado || 'DISPONIBLE'}
              </span>
            </div>
          </div>

          {/* Misión Activa en Curso */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Misión en Despacho</p>
            {miMisionActiva ? (
              <div className="mt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    Incidente #{miMisionActiva.id}
                  </span>
                  <EstadoBadge estado={miMisionActiva.estado} />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {miMisionActiva.descripcion}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-500">
                    Prioridad: <strong className="text-red-700 font-mono">P{miMisionActiva.prioridad}</strong> | {miMisionActiva.tipo_emergencia?.nombre}
                  </div>
                  <Link href={`/dashboard/emergencias/${miMisionActiva.id}`}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Gestionar Misión <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-center py-6 text-slate-500">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800">Sin orden de despacho pendiente</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  La unidad se encuentra en estado disponible a la espera de instrucciones de la mesa de despacho.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recordatorio de App Móvil Institucional */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 flex items-start gap-4">
          <Smartphone className="h-6 w-6 text-blue-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 space-y-1">
            <p className="font-bold text-sm">Operatividad en Campo recomendada: App Móvil SIGEM</p>
            <p className="text-blue-800 leading-relaxed">
              Para el reporte de geoposicionamiento GPS continuo durante el desplazamiento y la captura fotográfica de evidencias en la escena, utilice el dispositivo móvil institucional con la aplicación React Native / Expo vinculada.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────
   * 2. VISTA UNIFICADA: OPERADOR INTEGRAL (Triage & Despacho CAD)
   * ───────────────────────────────────────────────────────────────── */
  if (esOperadorIntegral) {
    const colaTriage = emergencias.filter((e) => e.estado === EstadoEmergencia.REPORTADO);
    const colaDespacho = emergencias.filter((e) => e.estado === EstadoEmergencia.CLASIFICADO);
    const colaAtencion = emergencias.filter(
      (e) => e.estado === EstadoEmergencia.ASIGNADO || e.estado === EstadoEmergencia.EN_ATENCION
    );
    const activasTotal = emergencias.filter((e) => e.estado !== EstadoEmergencia.CERRADO);

    const casosVisibles =
      tabOperativa === 'TRIAGE'
        ? colaTriage
        : tabOperativa === 'DESPACHO'
        ? colaDespacho
        : tabOperativa === 'ATENCION'
        ? colaAtencion
        : activasTotal;

    return (
      <div className="space-y-6">
        {/* Cabecera Unificada Operador Integral */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 border border-blue-200">
                CAD 123 • Operador Integral
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Consola Operativa de Triage y Despacho</h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Puesto unificado: validación y tipificación de incidentes (RF-03), asignación de recursos móviles (RF-05) y geocontrol de flota en Cartagena.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/mapa">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                <MapIcon className="h-4 w-4 text-blue-600" /> Mapa Táctico en Vivo
              </Button>
            </Link>
            <Link href="/dashboard/unidades">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-slate-700" /> Flota ({unidades.length})
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Indicadores Clave de Operación en Tiempo Real */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            onClick={() => setTabOperativa('TRIAGE')}
            className={`cursor-pointer rounded-xl border p-4 shadow-sm transition-all ${
              tabOperativa === 'TRIAGE'
                ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300'
                : 'border-amber-200 bg-amber-50/50 hover:bg-amber-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">1. Por Clasificar (Triage)</p>
              <PhoneCall className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-amber-950 font-mono tabular-nums">{colaTriage.length}</p>
            <p className="text-xs text-amber-700 mt-0.5">Alertas entrantes (RF-03)</p>
          </div>

          <div
            onClick={() => setTabOperativa('DESPACHO')}
            className={`cursor-pointer rounded-xl border p-4 shadow-sm transition-all ${
              tabOperativa === 'DESPACHO'
                ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-300'
                : 'border-purple-200 bg-purple-50/50 hover:bg-purple-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-800">2. Por Despachar</p>
              <AlertTriangle className="h-4 w-4 text-purple-600" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-purple-950 font-mono tabular-nums">{colaDespacho.length}</p>
            <p className="text-xs text-purple-700 mt-0.5">Listos para asignar móvil (RF-05)</p>
          </div>

          <div
            onClick={() => setTabOperativa('ATENCION')}
            className={`cursor-pointer rounded-xl border p-4 shadow-sm transition-all ${
              tabOperativa === 'ATENCION'
                ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-300'
                : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-800">3. En Atención</p>
              <Radio className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-blue-950 font-mono tabular-nums">{colaAtencion.length}</p>
            <p className="text-xs text-blue-700 mt-0.5">En desplazamiento / escena</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">4. Flota Disponible</p>
              <Truck className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-emerald-950 font-mono tabular-nums">
              {unidadesDisponibles} <span className="text-sm font-normal text-emerald-700">/ {unidades.length}</span>
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">Unidades listas en Cartagena</p>
          </div>
        </div>

        {/* Selector de Pestañas de la Consola */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            {[
              { id: 'TODAS', label: `Todos los Activos (${activasTotal.length})` },
              { id: 'TRIAGE', label: `Cola de Triage (${colaTriage.length})` },
              { id: 'DESPACHO', label: `Cola de Despacho (${colaDespacho.length})` },
              { id: 'ATENCION', label: `En Atención (${colaAtencion.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabOperativa(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tabOperativa === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Sincronización en vivo CAD 123
          </div>
        </div>

        {/* Bandeja de Trabajo Activa Unificada */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {casosVisibles.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">No hay incidentes en esta cola</p>
              <p className="text-xs text-slate-500 mt-1">Todos los reportes de este estado han sido atendidos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Estado / Etapa</th>
                    <th className="px-4 py-3">Descripción e Incidente</th>
                    <th className="px-4 py-3">Reportante / Ubicación</th>
                    <th className="px-4 py-3">Hora</th>
                    <th className="px-4 py-3 text-right">Acción Operativa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {casosVisibles.map((e) => {
                    const esReportado = e.estado === EstadoEmergencia.REPORTADO;
                    const esClasificado = e.estado === EstadoEmergencia.CLASIFICADO;
                    const esEnAtencion =
                      e.estado === EstadoEmergencia.ASIGNADO || e.estado === EstadoEmergencia.EN_ATENCION;

                    return (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">#{e.id}</td>
                        <td className="px-4 py-3">
                          <EstadoBadge estado={e.estado} />
                          {e.prioridad && (
                            <span className="block mt-1 text-[10px] font-bold text-slate-500">
                              Prioridad P{e.prioridad}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-sm">
                          {e.tipo_emergencia && (
                            <p className="font-bold text-slate-900 text-xs mb-0.5">
                              {e.tipo_emergencia.icono} {e.tipo_emergencia.nombre}
                            </p>
                          )}
                          <p className="text-slate-800 text-xs line-clamp-2">{e.descripcion}</p>
                          {e.evidencia_url && (
                            <span className="inline-block mt-1 text-[11px] font-semibold text-blue-600">
                              📷 Con evidencia adjunta
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          <p className="font-semibold text-slate-800">
                            {e.ciudadano ? `${e.ciudadano.nombre} ${e.ciudadano.apellido}` : 'Ciudadano'}
                          </p>
                          <p className="text-slate-400 font-mono text-[11px]">
                            {Number(e.latitud).toFixed(3)}, {Number(e.longitud).toFixed(3)}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                          {new Date(e.fecha_creacion).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/dashboard/emergencias/${e.id}`}>
                            {esReportado && (
                              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-xs">
                                <PhoneCall className="h-3.5 w-3.5 mr-1" /> Clasificar (RF-03)
                              </Button>
                            )}
                            {esClasificado && (
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs">
                                <Truck className="h-3.5 w-3.5 mr-1" /> Despachar (RF-05)
                              </Button>
                            )}
                            {esEnAtencion && (
                              <Button size="sm" variant="outline" className="text-xs">
                                <Eye className="h-3.5 w-3.5 mr-1" /> Control Táctico
                              </Button>
                            )}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mapa Táctico Integrado con Recursos y Despliegue */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Mapa Táctico de Despliegue y Recursos</h2>
              <p className="text-xs text-slate-500">
                Visualización satelital de alertas activas y ubicación de la flota en Cartagena de Indias
              </p>
            </div>
            <Link href="/dashboard/mapa">
              <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                <MapIcon className="h-3.5 w-3.5 text-blue-600" /> Pantalla Completa
              </Button>
            </Link>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <MapaInteractivo emergencias={emergencias} unidades={unidades} altura="420px" mostrarControles={true} />
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────
   * 4. VISTA INSTITUCIONAL GENERAL: ADMINISTRADOR / SUPERVISOR
   * ───────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Cabecera de Supervisión Global */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-900 text-slate-100 text-xs font-bold px-2.5 py-0.5 border border-slate-800">
              Gobernanza Institucional
            </span>
            <h1 className="text-2xl font-bold text-slate-900">Consola Central de Supervisión</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Gobernanza completa del ciclo de vida de emergencias, fiscalización de trazabilidad inmutable (RNF-09) y flota.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/auditoria">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-blue-600" /> Log de Auditoría
            </Button>
          </Link>
          <Link href="/dashboard/emergencias">
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 flex items-center gap-1.5">
              Historial de Casos <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas de Gobernanza */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">1. En Triage</p>
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-amber-950 font-mono tabular-nums">{totalReportadas}</p>
          <p className="text-xs text-amber-700 mt-1">REPORTADO (Captura ciudadana)</p>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-800">2. En Despacho</p>
            <AlertTriangle className="h-5 w-5 text-purple-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-purple-950 font-mono tabular-nums">{totalClasificadas}</p>
          <p className="text-xs text-purple-700 mt-1">CLASIFICADO (Por asignar recurso)</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-800">3. En Atención</p>
            <Truck className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-blue-950 font-mono tabular-nums">{totalEnAtencion}</p>
          <p className="text-xs text-blue-700 mt-1">ASIGNADO / EN_ESCENA</p>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50/60 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-green-800">4. Cerradas</p>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-green-950 font-mono tabular-nums">{totalCerradas}</p>
          <p className="text-xs text-green-700 mt-1">CERRADO (Resolución asentada)</p>
        </div>
      </div>

      {/* Selector de Vista: Mapa vs Tabla */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Incidentes y Recursos Activos</h2>
            <p className="text-xs text-slate-500">Distribución geográfica y cola de atención global</p>
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
          <p className="text-sm text-slate-500 py-10 text-center">Cargando consola institucional...</p>
        ) : vista === 'mapa' ? (
          <div className="rounded-xl overflow-hidden border border-slate-200">
            <MapaInteractivo emergencias={emergencias} unidades={unidades} altura="460px" mostrarControles={true} />
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
                  <th className="px-4 py-3 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {emergencias.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">#{e.id}</td>
                    <td className="px-4 py-3 text-xs">
                      {e.tipo_emergencia ? (
                        <span>
                          {e.tipo_emergencia.icono} {e.tipo_emergencia.nombre}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Sin clasificar</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-700 text-xs">{e.descripcion}</td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={e.estado} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold ${
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
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {e.ciudadano ? `${e.ciudadano.nombre} ${e.ciudadano.apellido}` : 'Ciudadano'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                      {new Date(e.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/emergencias/${e.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          Inspeccionar
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
