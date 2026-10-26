'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { CatalogoTipoEmergencia } from '@/types';
import { mockCatalogo } from '@/lib/mock-data';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const ICONOS_SUGERIDOS = ['🚑', '🚨', '🔥', '💥', '🌊', '🏥', '🛡️', '⚠️', '🚗', '⚡', '🌪️', '☣️'];

export default function CatalogoPage() {
  const [catalogo, setCatalogo] = useState<CatalogoTipoEmergencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos');

  // Estado del Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEnEdicion, setItemEnEdicion] = useState<CatalogoTipoEmergencia | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Formulario
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridadDefault, setPrioridadDefault] = useState<number>(3);
  const [icono, setIcono] = useState('🚨');
  const [activo, setActivo] = useState(true);

  const cargarCatalogo = async () => {
    setLoading(true);
    try {
      const res = await api.get('/catalogo?todos=true');
      if (res.data?.datos && res.data.datos.length > 0) {
        setCatalogo(res.data.datos);
      } else {
        setCatalogo(mockCatalogo);
      }
    } catch {
      setCatalogo(mockCatalogo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCatalogo();
  }, []);

  const abrirModalCrear = () => {
    setItemEnEdicion(null);
    setCodigo('');
    setNombre('');
    setDescripcion('');
    setPrioridadDefault(3);
    setIcono('🚨');
    setActivo(true);
    setErrorForm(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (item: CatalogoTipoEmergencia) => {
    setItemEnEdicion(item);
    setCodigo(item.codigo);
    setNombre(item.nombre);
    setDescripcion(item.descripcion || '');
    setPrioridadDefault(item.prioridad_default);
    setIcono(item.icono || '🚨');
    setActivo(item.activo);
    setErrorForm(null);
    setModalAbierto(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim()) {
      setErrorForm('El código institucional y el nombre del incidente son obligatorios.');
      return;
    }

    setGuardando(true);
    setErrorForm(null);

    const payload = {
      codigo: codigo.trim().toUpperCase(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      prioridad_default: Number(prioridadDefault),
      icono: icono.trim() || '🚨',
      activo,
    };

    try {
      if (itemEnEdicion) {
        // Actualizar existente
        await api.patch(`/catalogo/${itemEnEdicion.id}`, payload);
        setCatalogo((prev) =>
          prev.map((c) => (c.id === itemEnEdicion.id ? { ...c, ...payload } : c))
        );
      } else {
        // Crear nuevo
        const res = await api.post('/catalogo', payload);
        const creado = res.data?.datos || {
          id: Date.now(),
          ...payload,
        };
        setCatalogo((prev) => [creado, ...prev]);
      }
      setModalAbierto(false);
    } catch (err: any) {
      setErrorForm(err.response?.data?.mensaje || 'Error al guardar el tipo de emergencia');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Confirma que desea desactivar este tipo de emergencia del catálogo?')) {
      return;
    }

    try {
      await api.delete(`/catalogo/${id}`);
      setCatalogo((prev) =>
        prev.map((c) => (c.id === id ? { ...c, activo: false } : c))
      );
    } catch {
      // Fallback local
      setCatalogo((prev) =>
        prev.map((c) => (c.id === id ? { ...c, activo: false } : c))
      );
    }
  };

  // Filtrado de ítems
  const catalogoFiltrado = useMemo(() => {
    return catalogo.filter((item) => {
      const coincideTexto =
        item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(busqueda.toLowerCase()));

      const coincidePrioridad =
        filtroPrioridad === 'todos' || item.prioridad_default.toString() === filtroPrioridad;

      return coincideTexto && coincidePrioridad;
    });
  }, [catalogo, busqueda, filtroPrioridad]);

  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-mono">
              Catálogo de Tipos de Emergencia (RF-09)
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Administración centralizada de tipologías estandarizadas, iconos operativos y prioridades base.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={abrirModalCrear}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" /> Registrar Nuevo Tipo
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={cargarCatalogo}
            disabled={loading}
            className="p-2 border-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código (ej. INC_ESTR) o nombre..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Prioridad Base:
          </span>
          <select
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
          >
            <option value="todos">Todas las Prioridades</option>
            <option value="1">P1 - Crítica (Riesgo Vital)</option>
            <option value="2">P2 - Alta (Urgencia Mayor)</option>
            <option value="3">P3 - Media (Estable)</option>
            <option value="4">P4 - Baja (No Urgente)</option>
          </select>
        </div>
      </div>

      {/* Grid de Tarjetas de Catálogo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-3" />
            <p className="text-xs text-slate-500">Cargando catálogo institucional...</p>
          </div>
        ) : catalogoFiltrado.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-slate-200 bg-white">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-slate-700">No se encontraron tipos de emergencia</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Ajusta los filtros de búsqueda o registra un nuevo tipo.
            </p>
          </div>
        ) : (
          catalogoFiltrado.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-5 shadow-sm space-y-3 transition-all relative group flex flex-col justify-between ${
                item.activo ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50/70 opacity-65'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-3xl p-1 bg-slate-100 rounded-lg">{item.icono || '🚨'}</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                        item.prioridad_default === 1
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : item.prioridad_default === 2
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : item.prioridad_default === 3
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      P{item.prioridad_default} ·{' '}
                      {item.prioridad_default === 1
                        ? 'CRÍTICA'
                        : item.prioridad_default === 2
                        ? 'ALTA'
                        : item.prioridad_default === 3
                        ? 'MEDIA'
                        : 'BAJA'}
                    </span>

                    {!item.activo && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5">
                  <h3 className="font-bold text-slate-900 text-base leading-tight">{item.nombre}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    COD: <span className="text-blue-700 font-semibold">{item.codigo}</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {item.descripcion || 'Sin descripción detallada registrada.'}
                  </p>
                </div>
              </div>

              {/* Acciones de Edición y Eliminación */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => abrirModalEditar(item)}
                  className="text-xs flex items-center gap-1 text-slate-700 border-slate-300 hover:bg-slate-50 py-1"
                >
                  <Edit2 className="h-3 w-3 text-slate-500" /> Editar
                </Button>

                {item.activo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEliminar(item.id)}
                    className="text-xs flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50 py-1"
                  >
                    <Trash2 className="h-3 w-3" /> Desactivar
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Creación / Edición */}
      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={itemEnEdicion ? `Editar Tipo: ${itemEnEdicion.nombre}` : 'Registrar Nuevo Tipo de Emergencia'}
      >
        <form onSubmit={handleGuardar} className="space-y-4">
          {errorForm && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg">
              {errorForm}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Código Institucional *
              </label>
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej: TRAUMA_GRAVE"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold uppercase focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Prioridad Base Predeterminada *
              </label>
              <select
                value={prioridadDefault}
                onChange={(e) => setPrioridadDefault(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
              >
                <option value={1}>P1 - Crítica (Riesgo Vital Inmediato)</option>
                <option value={2}>P2 - Alta (Urgencia Severa)</option>
                <option value={3}>P3 - Media (Estable / Moderado)</option>
                <option value={4}>P4 - Baja (No Urgente)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nombre Oficial del Tipo de Emergencia *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Accidente de Tránsito con Múltiples Víctimas"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Descripción y Criterios Operativos
            </label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Instrucciones para el operador de Triage al clasificar este tipo de evento..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Icono Representativo
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={icono}
                onChange={(e) => setIcono(e.target.value)}
                className="w-14 text-center rounded-lg border border-slate-300 py-1.5 text-xl"
              />
              <div className="flex flex-wrap gap-1.5">
                {ICONOS_SUGERIDOS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcono(ic)}
                    className={`h-8 w-8 rounded text-lg flex items-center justify-center border transition-all ${
                      icono === ic
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-400'
                        : 'border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="cat_activo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="cat_activo" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Tipo de emergencia activo en la plataforma (disponible para triage y reporte)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalAbierto(false)}
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
              {guardando ? 'Guardando...' : itemEnEdicion ? 'Actualizar Tipo' : 'Crear en Catálogo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
