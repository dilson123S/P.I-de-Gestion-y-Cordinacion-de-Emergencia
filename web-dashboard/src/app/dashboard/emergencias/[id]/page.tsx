'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const MapaInteractivo = dynamic(() => import('@/components/mapa/MapaInteractivo'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-slate-100 flex items-center justify-center rounded-xl border border-slate-200">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  ),
});
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Shield,
  Truck,
  FileText,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import EstadoBadge from '@/components/emergencias/EstadoBadge';
import ClasificarModal from '@/components/emergencias/ClasificarModal';
import AsignarUnidadModal from '@/components/emergencias/AsignarUnidadModal';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Emergencia, EstadoEmergencia, CatalogoTipoEmergencia, Unidad, RolUsuario } from '@/types';
import { mockEmergencias, mockCatalogo, mockUnidades } from '@/lib/mock-data';

const obtenerUrlEvidencia = (url: string) => {
  if (/^https?:\/\//i.test(url)) return url;
  const apiOrigin = (api.defaults.baseURL || 'http://localhost:3001/api/v1').replace(/\/api\/v1\/?$/, '');
  return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
};

export default function DetalleEmergenciaPage() {
  const params = useParams();
  const router = useRouter();
  const idEmergencia = params.id as string;
  const { usuario } = useAuth();

  const [emergencia, setEmergencia] = useState<Emergencia | null>(null);
  const [tiposCatalogo, setTiposCatalogo] = useState<CatalogoTipoEmergencia[]>(mockCatalogo);
  const [unidades, setUnidades] = useState<Unidad[]>(mockUnidades);
  const [loading, setLoading] = useState(true);
  const [accionLoading, setAccionLoading] = useState(false);

  // Modales
  const [modalClasificarOpen, setModalClasificarOpen] = useState(false);
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [modalCerrarOpen, setModalCerrarOpen] = useState(false);
  const [resolucionTexto, setResolucionTexto] = useState('');

  const cargarEmergencia = useCallback(async () => {
    try {
      const res = await api.get(`/emergencias/${idEmergencia}`);
      if (res.data?.datos) {
        setEmergencia(res.data.datos);
      } else {
        const encontrada =
          mockEmergencias.find((e) => e.id === parseInt(idEmergencia, 10)) ||
          mockEmergencias[0];
        setEmergencia(encontrada);
      }
    } catch (err) {
      const encontrada =
        mockEmergencias.find((e) => e.id === parseInt(idEmergencia, 10)) ||
        mockEmergencias[0];
      setEmergencia(encontrada);
    } finally {
      setLoading(false);
    }
  }, [idEmergencia]);

  useEffect(() => {
    cargarEmergencia();

    api
      .get('/catalogo')
      .then((res) => {
        if (res.data?.datos && res.data.datos.length > 0) setTiposCatalogo(res.data.datos);
      })
      .catch(() => setTiposCatalogo(mockCatalogo));

    api
      .get('/unidades?estado=DISPONIBLE')
      .then((res) => {
        if (res.data?.datos && res.data.datos.length > 0) setUnidades(res.data.datos);
      })
      .catch(() => setUnidades(mockUnidades));
  }, [cargarEmergencia]);

  // Transición 1: Clasificar (RF-03)
  const handleClasificar = async (data: { id_tipo_emergencia: number; prioridad: number; notas_clasificacion?: string }) => {
    try {
      await api.patch(`/emergencias/${idEmergencia}/clasificar`, data);
      await cargarEmergencia();
    } catch {
      // Modo local simulado
      setEmergencia((prev) => {
        if (!prev) return null;
        const tipo = tiposCatalogo.find((t) => t.id === data.id_tipo_emergencia);
        return {
          ...prev,
          estado: EstadoEmergencia.CLASIFICADO,
          prioridad: data.prioridad,
          notas_clasificacion: data.notas_clasificacion,
          tipo_emergencia: tipo,
          operador: usuario || mockEmergencias[1].operador,
          fecha_clasificacion: new Date().toISOString(),
        };
      });
    }
  };

  // Transición 2: Asignar Unidad (RF-05)
  const handleAsignar = async (data: { id_unidad: number; notas_despacho?: string }) => {
    try {
      await api.patch(`/emergencias/${idEmergencia}/asignar`, data);
      await cargarEmergencia();
    } catch {
      // Modo local simulado
      setEmergencia((prev) => {
        if (!prev) return null;
        const u = unidades.find((item) => item.id === data.id_unidad);
        return {
          ...prev,
          estado: EstadoEmergencia.ASIGNADO,
          notas_despacho: data.notas_despacho,
          unidad: u,
          despachador: usuario || mockEmergencias[2].despachador,
          fecha_asignacion: new Date().toISOString(),
        };
      });
    }
  };

  // Transición 3: Iniciar Atención
  const handleIniciarAtencion = async () => {
    if (!confirm('¿Confirma que la unidad ha arribado a la escena e inicia atención?')) return;
    setAccionLoading(true);
    try {
      await api.patch(`/emergencias/${idEmergencia}/iniciar-atencion`, {
        notas_atencion: 'Unidad reporta llegada al punto de emergencia.',
      });
      await cargarEmergencia();
    } catch {
      setEmergencia((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          estado: EstadoEmergencia.EN_ATENCION,
          notas_atencion: 'Unidad reporta arribo y atención en escena iniciada.',
          fecha_inicio_atencion: new Date().toISOString(),
        };
      });
    } finally {
      setAccionLoading(false);
    }
  };

  // Transición 4: Cerrar Emergencia
  const handleCerrar = async () => {
    if (!resolucionTexto.trim()) return;
    setAccionLoading(true);
    try {
      await api.patch(`/emergencias/${idEmergencia}/cerrar`, {
        resolucion: resolucionTexto,
      });
      setModalCerrarOpen(false);
      await cargarEmergencia();
    } catch {
      setEmergencia((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          estado: EstadoEmergencia.CERRADO,
          resolucion: resolucionTexto,
          fecha_cierre: new Date().toISOString(),
        };
      });
      setModalCerrarOpen(false);
    } finally {
      setAccionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!emergencia) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Emergencia no encontrada</p>
        <Link href="/dashboard/emergencias" className="text-blue-600 underline text-sm mt-2 block">
          Volver al listado
        </Link>
      </div>
    );
  }

  const esAdmin = usuario?.rol === RolUsuario.ADMIN;
  const esOperadorIntegral =
    usuario?.rol === RolUsuario.OPERADOR_INTEGRAL ||
    (usuario?.rol as string) === 'OPERADOR' ||
    (usuario?.rol as string) === 'DESPACHADOR' ||
    esAdmin ||
    true; // Permitir en demo
  const esPersonalCampo = usuario?.rol === RolUsuario.PERSONAL_CAMPO || esAdmin || true;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado y barra de navegación */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/emergencias">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Emergencia #{emergencia.id}</h1>
              <EstadoBadge estado={emergencia.estado} />
            </div>
            <p className="text-xs text-slate-500">
              Registrado el {new Date(emergencia.fecha_creacion).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Acciones de Transición de Estado según el rol (Operador Integral / Admin) */}
        <div className="flex flex-wrap items-center gap-2">
          {emergencia.estado === EstadoEmergencia.REPORTADO && esOperadorIntegral && (
            <Button onClick={() => setModalClasificarOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              Clasificar Reporte (RF-03)
            </Button>
          )}

          {emergencia.estado === EstadoEmergencia.CLASIFICADO && esOperadorIntegral && (
            <Button onClick={() => setModalAsignarOpen(true)} className="bg-purple-600 hover:bg-purple-700">
              Despachar Unidad (RF-05)
            </Button>
          )}

          {emergencia.estado === EstadoEmergencia.ASIGNADO && (esPersonalCampo || esOperadorIntegral) && (
            <Button onClick={handleIniciarAtencion} disabled={accionLoading} className="bg-orange-600 hover:bg-orange-700">
              Iniciar Atención en Escena
            </Button>
          )}

          {emergencia.estado === EstadoEmergencia.EN_ATENCION && (esPersonalCampo || esOperadorIntegral) && (
            <Button onClick={() => setModalCerrarOpen(true)} className="bg-green-600 hover:bg-green-700">
              Cerrar Emergencia
            </Button>
          )}
        </div>
      </div>

      {/* Grid Principal: Datos de Captura y Actores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Información de Captura Inicial (RNF-07: Registro Único) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Datos de Captura Inicial (Registro Único RNF-07)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Descripción del Hecho
                </label>
                <p className="mt-1 text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {emergencia.descripcion}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Coordenadas Geográficas
                  </label>
                  <p className="mt-1 text-sm font-mono text-slate-800">
                    Lat: {emergencia.latitud.toFixed(6)}, Lon: {emergencia.longitud.toFixed(6)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${emergencia.latitud},${emergencia.longitud}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                  >
                    Ver en Google Maps <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Evidencia Multimedia
                  </label>
                  {emergencia.evidencia_url ? (
                    <div className="mt-1">
                      <a
                        href={obtenerUrlEvidencia(emergencia.evidencia_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline font-medium"
                      >
                        Abrir Foto / Video Adjunto <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">Sin archivo multimedia adjunto</p>
                  )}
                </div>
              </div>

              {/* Mapa Interactivo Incrustado con la posición del caso */}
              <div className="pt-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  Localización y Posición de Unidad en Tiempo Real
                </label>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <MapaInteractivo
                    emergencias={[emergencia]}
                    unidades={emergencia.unidad ? [emergencia.unidad] : []}
                    centro={[emergencia.latitud, emergencia.longitud]}
                    zoom={15}
                    emergenciaSeleccionadaId={emergencia.id}
                    altura="320px"
                    mostrarControles={false}
                  />
                </div>
              </div>

              {/* Notas de Fases Posteriores */}
              {emergencia.notas_clasificacion && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-slate-500">Notas de Clasificación:</span>
                  <p className="text-sm text-slate-700 mt-0.5">{emergencia.notas_clasificacion}</p>
                </div>
              )}

              {emergencia.notas_despacho && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-slate-500">Instrucciones de Despacho:</span>
                  <p className="text-sm text-slate-700 mt-0.5">{emergencia.notas_despacho}</p>
                </div>
              )}

              {emergencia.resolucion && (
                <div className="border-t border-slate-100 pt-3 bg-green-50 p-3 rounded-lg border border-green-200">
                  <span className="text-xs font-bold text-green-800 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" /> Resolución Final de Cierre:
                  </span>
                  <p className="text-sm text-green-950 mt-1">{emergencia.resolucion}</p>
                </div>
              )}
            </div>
          </div>

          {/* RNF-09: Log de Auditoría y Trazabilidad Estricta */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              Auditoría y Trazabilidad Estricta (RNF-09)
            </h2>

            {!emergencia.logs_auditoria || emergencia.logs_auditoria.length === 0 ? (
              <p className="text-xs text-slate-400">No hay logs registrados aún.</p>
            ) : (
              <div className="relative border-l border-slate-200 ml-3 space-y-4">
                {emergencia.logs_auditoria.map((log) => (
                  <div key={log.id} className="ml-4 relative">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600 border-2 border-white" />
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{log.accion_realizada}</p>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(log.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Por: <span className="font-medium text-slate-700">{log.usuario_accion?.nombre} {log.usuario_accion?.apellido}</span> ({log.usuario_accion?.rol})
                    </p>
                    {log.estado_anterior && log.estado_nuevo && (
                      <p className="text-xs text-slate-600 mt-1 font-mono">
                        {log.estado_anterior} → <span className="font-bold text-blue-600">{log.estado_nuevo}</span>
                      </p>
                    )}
                    {log.datos_modificados && (
                      <pre className="mt-1 text-[11px] bg-slate-50 p-2 rounded text-slate-600 overflow-x-auto border border-slate-100">
                        {JSON.stringify(log.datos_modificados, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Conexión de Actores (Llaves Foráneas) */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Actores Vinculados
            </h2>

            <div className="space-y-4 text-sm divide-y divide-slate-100">
              {/* RF-01: Ciudadano */}
              <div className="pt-2 first:pt-0">
                <span className="text-xs text-slate-400 font-semibold uppercase">RF-01: Ciudadano Reportante</span>
                <p className="font-medium text-slate-900 mt-0.5">
                  {emergencia.ciudadano?.nombre} {emergencia.ciudadano?.apellido}
                </p>
                <p className="text-xs text-slate-500">{emergencia.ciudadano?.email}</p>
                {emergencia.ciudadano?.telefono && (
                  <p className="text-xs text-slate-500">Tel: {emergencia.ciudadano.telefono}</p>
                )}
              </div>

              {/* RF-03: Operador Integral (Triage) */}
              <div className="pt-3">
                <span className="text-xs text-slate-400 font-semibold uppercase">RF-03: Operador Integral (Triage)</span>
                {emergencia.operador ? (
                  <>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {emergencia.operador.nombre} {emergencia.operador.apellido}
                    </p>
                    <p className="text-xs text-slate-500">{emergencia.operador.email}</p>
                  </>
                ) : (
                  <p className="text-xs italic text-slate-400 mt-0.5">Pendiente de clasificación</p>
                )}
              </div>

              {/* RF-05: Operador Integral (Despacho) */}
              <div className="pt-3">
                <span className="text-xs text-slate-400 font-semibold uppercase">RF-05: Operador Integral (Despacho)</span>
                {emergencia.despachador ? (
                  <>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {emergencia.despachador.nombre} {emergencia.despachador.apellido}
                    </p>
                    <p className="text-xs text-slate-500">{emergencia.despachador.email}</p>
                  </>
                ) : (
                  <p className="text-xs italic text-slate-400 mt-0.5">Pendiente de despacho</p>
                )}
              </div>

              {/* Unidad Despachada */}
              <div className="pt-3">
                <span className="text-xs text-slate-400 font-semibold uppercase">Unidad Despachada</span>
                {emergencia.unidad ? (
                  <div className="mt-1 rounded-lg bg-blue-50 p-2.5 border border-blue-200">
                    <p className="font-bold text-blue-900">
                      🚑 {emergencia.unidad.codigo} - {emergencia.unidad.tipo}
                    </p>
                    {emergencia.unidad.placa && (
                      <p className="text-xs text-blue-700">Placa: {emergencia.unidad.placa}</p>
                    )}
                    <p className="text-xs text-blue-700 font-mono mt-0.5">
                      Estado Unidad: {emergencia.unidad.estado}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-400 mt-0.5">Sin unidad asignada</p>
                )}
              </div>

              {/* RF-09: Catálogo Administrable */}
              <div className="pt-3">
                <span className="text-xs text-slate-400 font-semibold uppercase">RF-09: Catálogo Tipo</span>
                {emergencia.tipo_emergencia ? (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xl">{emergencia.tipo_emergencia.icono}</span>
                    <div>
                      <p className="font-semibold text-slate-900">{emergencia.tipo_emergencia.nombre}</p>
                      <p className="text-xs text-slate-500">{emergencia.tipo_emergencia.descripcion}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-400 mt-0.5">Sin tipificar aún</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales de Transición */}
      <ClasificarModal
        isOpen={modalClasificarOpen}
        onClose={() => setModalClasificarOpen(false)}
        onConfirm={handleClasificar}
        tiposCatalogo={tiposCatalogo}
      />

      <AsignarUnidadModal
        isOpen={modalAsignarOpen}
        onClose={() => setModalAsignarOpen(false)}
        onConfirm={handleAsignar}
        unidadesDisponibles={unidades}
      />

      {/* Modal para Cerrar Emergencia */}
      {modalCerrarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Cerrar Caso de Emergencia</h3>
            <p className="text-xs text-slate-500 mb-4">
              La unidad de respuesta será liberada y quedará nuevamente en estado DISPONIBLE.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Resolución / Informe Final del Caso
                </label>
                <textarea
                  value={resolucionTexto}
                  onChange={(e) => setResolucionTexto(e.target.value)}
                  rows={4}
                  placeholder="Detalle de atención médica brindada, contención de fuego, traslado a hospital..."
                  required
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setModalCerrarOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCerrar}
                  disabled={!resolucionTexto.trim() || accionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {accionLoading ? 'Cerrando...' : 'Confirmar Cierre'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
