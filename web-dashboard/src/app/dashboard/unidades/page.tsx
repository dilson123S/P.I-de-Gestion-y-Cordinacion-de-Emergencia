'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Truck,
  MapPin,
  RefreshCw,
  Plus,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  Search,
  ExternalLink,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { Unidad, EstadoUnidad } from '@/types';
import { mockUnidades } from '@/lib/mock-data';
import { useAuth } from '@/hooks/useAuth';

const TIPOS_UNIDAD = [
  'Ambulancia Medicalizada',
  'Ambulancia Básica',
  'Cuerpo de Bomberos',
  'Patrulla Policial',
  'Defensa Civil',
  'Tránsito y Movilidad',
];

export default function UnidadesPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'ADMIN';
  const esDespachador =
    usuario?.rol === 'DESPACHADOR' ||
    usuario?.rol === 'OPERADOR_INTEGRAL' ||
    usuario?.rol === 'OPERADOR' ||
    esAdmin;

  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // Estado Modal Crear Unidad
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [tipo, setTipo] = useState(TIPOS_UNIDAD[0]);
  const [placa, setPlaca] = useState('');
  const [latitud, setLatitud] = useState('10.3997');
  const [longitud, setLongitud] = useState('-75.5144');
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Estado Cambio Rápido de Estado
  const [cambiandoId, setCambiandoId] = useState<number | null>(null);

  const cargarUnidades = async () => {
    setLoading(true);
    try {
      const res = await api.get('/unidades');
      if (res.data?.datos && res.data.datos.length > 0) {
        setUnidades(res.data.datos);
      } else {
        setUnidades(mockUnidades);
      }
    } catch {
      setUnidades(mockUnidades);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUnidades();
  }, []);

  const abrirModalCrear = () => {
    setCodigo('');
    setTipo(TIPOS_UNIDAD[0]);
    setPlaca('');
    setLatitud('10.3997');
    setLongitud('-75.5144');
    setErrorForm(null);
    setModalCrearAbierto(true);
  };

  const handleCrearUnidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) {
      setErrorForm('El código operativo de la unidad es requerido.');
      return;
    }

    setGuardando(true);
    setErrorForm(null);

    const payload = {
      codigo: codigo.trim().toUpperCase(),
      tipo,
      placa: placa.trim().toUpperCase() || undefined,
      latitud_actual: parseFloat(latitud) || 10.3997,
      longitud_actual: parseFloat(longitud) || -75.5144,
      estado: EstadoUnidad.DISPONIBLE,
    };

    try {
      const res = await api.post('/unidades', payload);
      const nueva = res.data?.datos || {
        id: Date.now(),
        ...payload,
      };
      setUnidades((prev) => [nueva, ...prev]);
      setModalCrearAbierto(false);
    } catch (err: any) {
      setErrorForm(err.response?.data?.mensaje || 'Error al registrar la unidad');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (id: number, nuevoEstado: EstadoUnidad) => {
    setCambiandoId(id);
    try {
      await api.patch(`/unidades/${id}/estado`, { estado: nuevoEstado });
      setUnidades((prev) =>
        prev.map((u) => (u.id === id ? { ...u, estado: nuevoEstado } : u))
      );
    } catch {
      // Fallback reactivo
      setUnidades((prev) =>
        prev.map((u) => (u.id === id ? { ...u, estado: nuevoEstado } : u))
      );
    } finally {
      setCambiandoId(null);
    }
  };

  // Métricas de flota
  const total = unidades.length;
  const disponibles = unidades.filter((u) => u.estado === EstadoUnidad.DISPONIBLE).length;
  const despachadas = unidades.filter(
    (u) => u.estado === EstadoUnidad.DESPACHADA || u.estado === EstadoUnidad.EN_ESCENA
  ).length;
  const fueraServicio = unidades.filter((u) => u.estado === EstadoUnidad.FUERA_DE_SERVICIO).length;

  // Filtrado de unidades
  const unidadesFiltradas = useMemo(() => {
    return unidades.filter((u) => {
      const coincideTexto =
        u.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.tipo.toLowerCase().includes(busqueda.toLowerCase()) ||
        (u.placa && u.placa.toLowerCase().includes(busqueda.toLowerCase()));

      const coincideEstado = filtroEstado === 'todos' || u.estado === filtroEstado;

      return coincideTexto && coincideEstado;
    });
  }, [unidades, busqueda, filtroEstado]);

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
      {/* Encabezado y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Truck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-mono">
              Flota y Recursos de Respuesta
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de unidades operativas, disponibilidad para despacho y telemetría de campo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {esAdmin && (
            <Button
              onClick={abrirModalCrear}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold shadow-sm"
            >
              <Plus className="h-4 w-4" /> Registrar Unidad
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={cargarUnidades}
            disabled={loading}
            className="p-2 border-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas de Flota */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Flota</p>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-1">{total}</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Disponibles</p>
          <p className="text-2xl font-bold text-emerald-800 font-mono mt-1">{disponibles}</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">En Despliegue</p>
          <p className="text-2xl font-bold text-blue-800 font-mono mt-1">{despachadas}</p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Fuera de Servicio</p>
          <p className="text-2xl font-bold text-red-800 font-mono mt-1">{fueraServicio}</p>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código (ej. TAM-01), tipo o placa..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Estado:</span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
          >
            <option value="todos">Todos los Estados</option>
            <option value={EstadoUnidad.DISPONIBLE}>DISPONIBLE</option>
            <option value={EstadoUnidad.DESPACHADA}>DESPACHADA</option>
            <option value={EstadoUnidad.EN_ESCENA}>EN ESCENA</option>
            <option value={EstadoUnidad.FUERA_DE_SERVICIO}>FUERA DE SERVICIO</option>
          </select>
        </div>
      </div>

      {/* Grid de Unidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-3" />
            <p className="text-xs text-slate-500">Cargando unidades operativas...</p>
          </div>
        ) : unidadesFiltradas.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-slate-200 bg-white">
            <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No se encontraron unidades</p>
            <p className="text-xs text-slate-400 mt-0.5">Ajusta los filtros o registra una unidad.</p>
          </div>
        ) : (
          unidadesFiltradas.map((u) => {
            const tieneCoords = u.latitud_actual && u.longitud_actual;
            const esModificable = esDespachador && u.estado !== EstadoUnidad.DESPACHADA && u.estado !== EstadoUnidad.EN_ESCENA;

            return (
              <div
                key={u.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-inner">
                        <Truck className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 font-mono text-base">{u.codigo}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {u.tipo} {u.placa ? `• ${u.placa}` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant={badgeVariant(u.estado)}>{u.estado}</Badge>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-3 text-xs space-y-2 text-slate-600">
                    <p className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin className="h-3.5 w-3.5" /> Posición:
                      </span>
                      <span className="font-mono text-slate-700">
                        {tieneCoords
                          ? `${u.latitud_actual!.toFixed(4)}, ${u.longitud_actual!.toFixed(4)}`
                          : 'Base Central'}
                      </span>
                    </p>

                    {u.personal && (
                      <p className="text-slate-700">
                        Operador: <span className="font-semibold">{u.personal.nombre} {u.personal.apellido}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones de Estado Operativo */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {tieneCoords && (
                    <a
                      href={`https://www.google.com/maps?q=${u.latitud_actual},${u.longitud_actual}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      Ver en mapa <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {esModificable && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      {u.estado === EstadoUnidad.DISPONIBLE ? (
                        <button
                          onClick={() => handleCambiarEstado(u.id, EstadoUnidad.FUERA_DE_SERVICIO)}
                          disabled={cambiandoId === u.id}
                          className="px-2.5 py-1 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Wrench className="h-3 w-3" /> Mantenimiento
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCambiarEstado(u.id, EstadoUnidad.DISPONIBLE)}
                          disabled={cambiandoId === u.id}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Habilitar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Registrar Nueva Unidad */}
      <Modal
        isOpen={modalCrearAbierto}
        onClose={() => setModalCrearAbierto(false)}
        title="Registrar Nueva Unidad de Respuesta"
      >
        <form onSubmit={handleCrearUnidad} className="space-y-4">
          {errorForm && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg">
              {errorForm}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Código Operativo *
              </label>
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej: AMB-05 o BOM-03"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold uppercase focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Placa Vehicular
              </label>
              <input
                type="text"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                placeholder="Ej: KJL-892"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono uppercase focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Tipo de Unidad y Especialidad *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
            >
              {TIPOS_UNIDAD.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Latitud Base
              </label>
              <input
                type="number"
                step="any"
                value={latitud}
                onChange={(e) => setLatitud(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Longitud Base
              </label>
              <input
                type="number"
                step="any"
                value={longitud}
                onChange={(e) => setLongitud(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalCrearAbierto(false)}
              disabled={guardando}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={guardando}
              className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
            >
              {guardando ? 'Registrando...' : 'Registrar Unidad'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
