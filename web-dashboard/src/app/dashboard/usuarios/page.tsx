'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Shield,
  Phone,
  Mail,
  Key,
  ShieldAlert,
  Edit3,
  Trash2,
  Headphones,
  Radio,
  Smartphone,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Usuario, RolUsuario, formatearRol } from '@/types';
import { mockUsuarios } from '@/lib/mock-data';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('todos');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modal Crear Nuevo Personal
  const [modalAltaAbierto, setModalAltaAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<RolUsuario>(RolUsuario.OPERADOR_INTEGRAL);
  const [siglaUnidad, setSiglaUnidad] = useState<'PL' | 'AM' | 'BM' | 'TR' | 'DC'>('PL');
  const [guardandoAlta, setGuardandoAlta] = useState(false);
  const [errorAlta, setErrorAlta] = useState<string | null>(null);

  // Modal Edición de Usuario
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editApellido, setEditApellido] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editRol, setEditRol] = useState<RolUsuario>(RolUsuario.OPERADOR_INTEGRAL);
  const [editSiglaUnidad, setEditSiglaUnidad] = useState<'PL' | 'AM' | 'BM' | 'TR' | 'DC'>('PL');
  const [editPassword, setEditPassword] = useState('');
  const [editActivo, setEditActivo] = useState(true);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);

  // Modal Eliminación de Usuario
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [usuarioEliminando, setUsuarioEliminando] = useState<Usuario | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  // Estado para cambio rápido de estado activo/inactivo
  const [modificandoId, setModificandoId] = useState<number | null>(null);

  const mostrarExitoTemporal = (mensaje: string) => {
    setMensajeExito(mensaje);
    setTimeout(() => {
      setMensajeExito(null);
    }, 4500);
  };

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const res = await api.get('/usuarios');
      if (res.data?.datos && res.data.datos.length > 0) {
        setUsuarios(res.data.datos);
      } else {
        setUsuarios(mockUsuarios);
      }
    } catch {
      setUsuarios(mockUsuarios);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // ─── Alta de Usuario (Crear Nuevo Personal) ───
  const abrirModalAlta = () => {
    setNombre('');
    setApellido('');
    setEmail('');
    setTelefono('');
    setPassword('');
    setRol(RolUsuario.OPERADOR_INTEGRAL);
    setSiglaUnidad('PL');
    setErrorAlta(null);
    setModalAltaAbierto(true);
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !apellido.trim() || !email.trim()) {
      setErrorAlta('Nombre, apellido y correo institucional son obligatorios.');
      return;
    }

    setGuardandoAlta(true);
    setErrorAlta(null);

    const payload: any = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim() || undefined,
      password: password.trim() || 'sigem1234',
      rol,
    };

    if (rol === RolUsuario.PERSONAL_CAMPO) {
      payload.sigla_unidad = siglaUnidad;
    }

    try {
      const res = await api.post('/usuarios', payload);
      const nuevo = res.data?.datos || {
        id: Date.now(),
        ...payload,
        activo: true,
        fecha_creacion: new Date().toISOString(),
      };

      setUsuarios((prev) => [...prev, nuevo]);
      setModalAltaAbierto(false);

      if (rol === RolUsuario.PERSONAL_CAMPO) {
        const codigoGen = nuevo.unidad_asignada?.codigo || `${siglaUnidad}-XX`;
        mostrarExitoTemporal(
          `Personal de Campo "${payload.nombre} ${payload.apellido}" registrado. Se asignó automáticamente la unidad [${codigoGen}] en estado DISPONIBLE.`
        );
      } else {
        mostrarExitoTemporal(`Personal "${payload.nombre} ${payload.apellido}" creado exitosamente.`);
      }
    } catch (err: any) {
      setErrorAlta(err.response?.data?.mensaje || 'Error al registrar el personal institucional.');
    } finally {
      setGuardandoAlta(false);
    }
  };

  // ─── Edición de Usuario ───
  const abrirModalEdicion = (u: Usuario) => {
    setUsuarioEditando(u);
    setEditNombre(u.nombre);
    setEditApellido(u.apellido);
    setEditEmail(u.email);
    setEditTelefono(u.telefono || '');
    setEditRol(u.rol);
    setEditSiglaUnidad('PL');
    setEditPassword('');
    setEditActivo(u.activo);
    setErrorEdicion(null);
    setModalEdicionAbierto(true);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    if (!editNombre.trim() || !editApellido.trim() || !editEmail.trim()) {
      setErrorEdicion('Nombre, apellido y correo institucional son obligatorios.');
      return;
    }

    setGuardandoEdicion(true);
    setErrorEdicion(null);

    const payload: any = {
      nombre: editNombre.trim(),
      apellido: editApellido.trim(),
      email: editEmail.trim().toLowerCase(),
      telefono: editTelefono.trim() || undefined,
      rol: editRol,
      activo: editActivo,
    };

    if (editPassword.trim()) {
      payload.password = editPassword.trim();
    }

    if (editRol === RolUsuario.PERSONAL_CAMPO) {
      payload.sigla_unidad = editSiglaUnidad;
    }

    try {
      const res = await api.patch(`/usuarios/${usuarioEditando.id}`, payload);
      const actualizado = res.data?.datos || {
        ...usuarioEditando,
        ...payload,
      };

      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuarioEditando.id ? { ...u, ...actualizado } : u))
      );
      setModalEdicionAbierto(false);
      mostrarExitoTemporal(`Perfil de "${editNombre} ${editApellido}" actualizado correctamente.`);
    } catch (err: any) {
      setErrorEdicion(err.response?.data?.mensaje || 'Error al actualizar el usuario.');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // ─── Eliminación de Usuario ───
  const abrirModalEliminar = (u: Usuario) => {
    setUsuarioEliminando(u);
    setErrorEliminar(null);
    setModalEliminarAbierto(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!usuarioEliminando) return;

    setEliminando(true);
    setErrorEliminar(null);

    try {
      const res = await api.delete(`/usuarios/${usuarioEliminando.id}`);
      const datos = res.data?.datos;

      // Si el backend devolvió activo: false, se aplicó baja lógica forense
      if (datos && datos.activo === false) {
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === usuarioEliminando.id
              ? { ...u, activo: false, nombre: `[Inactivo] ${u.nombre}` }
              : u
          )
        );
        mostrarExitoTemporal(
          `El usuario #${usuarioEliminando.id} tiene emergencias asociadas. Se aplicó baja lógica para preservar trazabilidad forense (RNF-09).`
        );
      } else {
        // Eliminación física
        setUsuarios((prev) => prev.filter((u) => u.id !== usuarioEliminando.id));
        mostrarExitoTemporal(`Usuario #${usuarioEliminando.id} eliminado satisfactoriamente del sistema.`);
      }

      setModalEliminarAbierto(false);
    } catch (err: any) {
      setErrorEliminar(err.response?.data?.mensaje || 'No se pudo eliminar el usuario seleccionado.');
    } finally {
      setEliminando(false);
    }
  };

  // ─── Toggle Rápido Activo / Inactivo ───
  const handleToggleActivo = async (id: number, estadoActual: boolean) => {
    setModificandoId(id);
    const nuevoEstado = !estadoActual;
    try {
      await api.patch(`/usuarios/${id}`, { activo: nuevoEstado });
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, activo: nuevoEstado } : u))
      );
      mostrarExitoTemporal(`Estado de la cuenta actualizado a ${nuevoEstado ? 'ACTIVO' : 'INACTIVO'}.`);
    } catch {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, activo: nuevoEstado } : u))
      );
    } finally {
      setModificandoId(null);
    }
  };

  // ─── Métricas Generales del Directorio ───
  const total = usuarios.length;
  const operadoresIntegrales = usuarios.filter(
    (u) =>
      u.rol === RolUsuario.OPERADOR_INTEGRAL ||
      u.rol === RolUsuario.OPERADOR ||
      u.rol === RolUsuario.DESPACHADOR
  ).length;
  const personalCampo = usuarios.filter((u) => u.rol === RolUsuario.PERSONAL_CAMPO).length;
  const administradores = usuarios.filter((u) => u.rol === RolUsuario.ADMIN).length;

  // ─── Filtrado ───
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const texto = `${u.nombre} ${u.apellido} ${u.email} ${u.telefono || ''}`.toLowerCase();
      const coincideTexto = texto.includes(busqueda.toLowerCase());

      let coincideRol = true;
      if (filtroRol !== 'todos') {
        if (filtroRol === RolUsuario.OPERADOR_INTEGRAL) {
          coincideRol =
            u.rol === RolUsuario.OPERADOR_INTEGRAL ||
            u.rol === RolUsuario.OPERADOR ||
            u.rol === RolUsuario.DESPACHADOR;
        } else {
          coincideRol = u.rol === filtroRol;
        }
      }

      return coincideTexto && coincideRol;
    });
  }, [usuarios, busqueda, filtroRol]);

  return (
    <div className="space-y-6">
      {/* Encabezado y Botón Crear Nuevo Personal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              Gobernanza y Directorio de Personal
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gestión institucional exclusiva de Administración: creación de Operadores Integrales (Web CAD) y Personal de Campo (App Móvil) con asignación automática de unidad.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón oficial: Crear Nuevo Personal */}
          <Button
            onClick={abrirModalAlta}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold shadow-sm"
          >
            <UserPlus className="h-4 w-4" /> Crear Nuevo Personal
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={cargarUsuarios}
            disabled={loading}
            className="p-2 border-slate-300 hover:bg-slate-50"
            title="Recargar directorio"
          >
            <RefreshCw className={`h-4 w-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Notificación de Éxito Temporal */}
      {mensajeExito && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{mensajeExito}</span>
        </div>
      )}

      {/* Tarjetas de Métricas de Personal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Usuarios</p>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-1">{total}</p>
          <p className="text-xs text-slate-500 mt-0.5">Registros en la base de datos</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-800">Operadores Integrales</p>
            <Headphones className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900 font-mono mt-1">{operadoresIntegrales}</p>
          <p className="text-xs text-blue-700 mt-0.5">Triage, clasificación y despacho (CAD Web)</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Personal de Campo</p>
            <Radio className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900 font-mono mt-1">{personalCampo}</p>
          <p className="text-xs text-amber-700 mt-0.5">Con unidad táctica asignada (App Móvil)</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">Administradores</p>
            <Shield className="h-4 w-4 text-slate-700" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-1">{administradores}</p>
          <p className="text-xs text-slate-500 mt-0.5">Supervisión general y gobernanza</p>
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
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filtrar por Rol:</span>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none font-medium"
          >
            <option value="todos">Todos los Roles</option>
            <option value={RolUsuario.OPERADOR_INTEGRAL}>Operadores Integrales (Consola Web CAD)</option>
            <option value={RolUsuario.PERSONAL_CAMPO}>Personal de Campo (App Móvil Táctica)</option>
            <option value={RolUsuario.ADMIN}>Administradores Generales</option>
            <option value={RolUsuario.CIUDADANO}>Ciudadanos (Reportantes Móviles)</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Cargando directorio de personal...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Funcionario / Usuario</th>
                  <th className="px-4 py-3">Correo Institucional</th>
                  <th className="px-4 py-3">Rol y Unidad Asignada</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                      No se encontraron usuarios que coincidan con la búsqueda o filtro aplicado.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((u) => {
                    const esAdminPrincipal = u.id === 1 && u.rol === RolUsuario.ADMIN;
                    const esOperador =
                      u.rol === RolUsuario.OPERADOR_INTEGRAL ||
                      u.rol === RolUsuario.OPERADOR ||
                      u.rol === RolUsuario.DESPACHADOR;
                    const esCampo = u.rol === RolUsuario.PERSONAL_CAMPO;
                    const esAdmin = u.rol === RolUsuario.ADMIN;
                    const esCiudadano = u.rol === RolUsuario.CIUDADANO;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-500">#{u.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm font-mono ${
                                esAdmin
                                  ? 'bg-slate-900'
                                  : esOperador
                                  ? 'bg-blue-600'
                                  : esCampo
                                  ? 'bg-amber-600'
                                  : 'bg-emerald-600'
                              }`}
                            >
                              {u.nombre.charAt(0)}
                              {u.apellido.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">
                                {u.nombre} {u.apellido}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Registrado: {u.fecha_creacion ? new Date(u.fecha_creacion).toLocaleDateString() : 'Activo'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          {esAdmin && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-900 text-white shadow-sm">
                              <Shield className="h-3 w-3 text-slate-300" /> Administrador
                            </span>
                          )}
                          {esOperador && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              <Headphones className="h-3 w-3 text-blue-600" /> Operador Integral (Web)
                            </span>
                          )}
                          {esCampo && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Radio className="h-3 w-3 text-amber-600" /> Personal de Campo (Móvil)
                              </span>
                              {u.unidad_asignada ? (
                                <div className="flex items-center gap-1.5 font-mono text-[10px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                                  <Truck className="h-3 w-3 text-blue-600" />
                                  Unidad: [{u.unidad_asignada.codigo}] {u.unidad_asignada.estado === 'DISPONIBLE' ? '🟢 Disponible' : '🟡 En Servicio'}
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 italic">Sin unidad vinculada</div>
                              )}
                            </div>
                          )}
                          {esCiudadano && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Smartphone className="h-3 w-3 text-emerald-600" /> Ciudadano (Móvil)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{u.telefono || '—'}</td>
                        <td className="px-4 py-3">
                          {u.activo ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" /> ACTIVO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              <XCircle className="h-3 w-3" /> INACTIVO
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Activo / Inactivo */}
                            <button
                              onClick={() => handleToggleActivo(u.id, u.activo)}
                              disabled={modificandoId === u.id || esAdminPrincipal}
                              title={u.activo ? 'Desactivar acceso al sistema' : 'Activar acceso'}
                              className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors border ${
                                esAdminPrincipal
                                  ? 'opacity-40 cursor-not-allowed text-slate-400 border-slate-200'
                                  : u.activo
                                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                              }`}
                            >
                              {u.activo ? 'Desactivar' : 'Activar'}
                            </button>

                            {/* Botón Modificar / Editar */}
                            <button
                              onClick={() => abrirModalEdicion(u)}
                              title="Modificar datos del funcionario"
                              className="p-1 rounded text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            {/* Botón Eliminar */}
                            <button
                              onClick={() => abrirModalEliminar(u)}
                              disabled={esAdminPrincipal}
                              title={
                                esAdminPrincipal
                                  ? 'No se puede eliminar al administrador principal'
                                  : 'Eliminar o dar de baja usuario'
                              }
                              className={`p-1 rounded border transition-colors ${
                                esAdminPrincipal
                                  ? 'opacity-30 cursor-not-allowed text-slate-400 border-slate-200'
                                  : 'text-slate-500 hover:text-red-600 hover:bg-red-50 border-slate-200'
                              }`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Crear Nuevo Personal Operativo */}
      <Modal
        isOpen={modalAltaAbierto}
        onClose={() => setModalAltaAbierto(false)}
        title="Crear Nuevo Personal Operativo"
      >
        <form onSubmit={handleCrearUsuario} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-800">
            <span className="font-bold">Gobernanza Centralizada:</span> Solo la Administración General tiene la facultad de crear operadores integrales y personal de campo en la plataforma.
          </div>

          {errorAlta && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg">
              {errorAlta}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Carlos"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                required
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                placeholder="Ej: Mendoza"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Correo Institucional *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos.mendoza@emergencias.gob"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="300 123 4567"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Rol Operativo / Destino *
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as RolUsuario)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
              >
                <option value={RolUsuario.OPERADOR_INTEGRAL}>
                  Operador Integral (Consola Web CAD 123)
                </option>
                <option value={RolUsuario.PERSONAL_CAMPO}>
                  Personal de Campo (App Móvil Táctica)
                </option>
                <option value={RolUsuario.ADMIN}>
                  Administrador General (Gobernanza Web)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Contraseña Temporal
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dejar vacío para default 'sigem1234'"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Asignación automática de unidad para Personal de Campo */}
          {rol === RolUsuario.PERSONAL_CAMPO && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-amber-700" />
                <span className="font-bold text-xs text-amber-900">
                  Asignación Automática de Unidad Táctica
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Cada funcionario de campo se vincula automáticamente con una unidad identificable por su sigla y un número correlativo (ej. <strong className="font-mono">PL-01</strong>, <strong className="font-mono">AM-01</strong>). La unidad quedará en estado <strong className="text-emerald-800">DISPONIBLE</strong> para que el Operador Integral la identifique y despache inmediatamente.
              </p>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Cuerpo / Sigla Institucional de la Unidad *
                </label>
                <select
                  value={siglaUnidad}
                  onChange={(e) => setSiglaUnidad(e.target.value as 'PL' | 'AM' | 'BM' | 'TR' | 'DC')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                >
                  <option value="PL">PL — Policía Nacional (Patrulla Policial - Prefijo PL-XX)</option>
                  <option value="AM">AM — Ambulancia Médica (Asistencia Médica TAB/TAM - Prefijo AM-XX)</option>
                  <option value="BM">BM — Cuerpo de Bomberos (Autobomba / Rescate - Prefijo BM-XX)</option>
                  <option value="TR">TR — Tránsito y Transporte (Unidad Vial - Prefijo TR-XX)</option>
                  <option value="DC">DC — Defensa Civil (Gestión de Riesgo y Desastres - Prefijo DC-XX)</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalAltaAbierto(false)}
              disabled={guardandoAlta}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={guardandoAlta}
              className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
            >
              {guardandoAlta ? 'Creando funcionario...' : 'Crear Personal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Modificar Funcionario */}
      <Modal
        isOpen={modalEdicionAbierto}
        onClose={() => setModalEdicionAbierto(false)}
        title={`Modificar Funcionario #${usuarioEditando?.id}`}
      >
        <form onSubmit={handleGuardarEdicion} className="space-y-4">
          {errorEdicion && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg">
              {errorEdicion}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                required
                value={editApellido}
                onChange={(e) => setEditApellido(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                value={editTelefono}
                onChange={(e) => setEditTelefono(e.target.value)}
                placeholder="+505 8888-0000"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Rol Asignado *
              </label>
              <select
                value={editRol}
                onChange={(e) => setEditRol(e.target.value as RolUsuario)}
                disabled={usuarioEditando?.id === 1 && usuarioEditando?.rol === RolUsuario.ADMIN}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none disabled:opacity-50"
              >
                <option value={RolUsuario.OPERADOR_INTEGRAL}>
                  Operador Integral (Consola Web CAD 123)
                </option>
                <option value={RolUsuario.PERSONAL_CAMPO}>
                  Personal de Campo (App Móvil Táctica)
                </option>
                <option value={RolUsuario.ADMIN}>
                  Administrador General (Gobernanza Web)
                </option>
                {usuarioEditando?.rol === RolUsuario.CIUDADANO && (
                  <option value={RolUsuario.CIUDADANO}>Ciudadano (Reportante Móvil)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Estado de la Cuenta
              </label>
              <select
                value={editActivo ? 'true' : 'false'}
                onChange={(e) => setEditActivo(e.target.value === 'true')}
                disabled={usuarioEditando?.id === 1 && usuarioEditando?.rol === RolUsuario.ADMIN}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none disabled:opacity-50"
              >
                <option value="true">Activo (Acceso Autorizado)</option>
                <option value="false">Inactivo (Acceso Suspendido)</option>
              </select>
            </div>
          </div>

          {editRol === RolUsuario.PERSONAL_CAMPO && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-amber-700" />
                  Unidad Táctica del Funcionario
                </span>
                {usuarioEditando?.unidad_asignada ? (
                  <span className="font-mono font-bold text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                    [{usuarioEditando.unidad_asignada.codigo}] {usuarioEditando.unidad_asignada.estado}
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-800 font-medium">Se asignará automáticamente</span>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Reasignar Sigla / Tipo de Unidad
                </label>
                <select
                  value={editSiglaUnidad}
                  onChange={(e) => setEditSiglaUnidad(e.target.value as 'PL' | 'AM' | 'BM' | 'TR' | 'DC')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                >
                  <option value="PL">PL — Policía Nacional</option>
                  <option value="AM">AM — Ambulancia Médica</option>
                  <option value="BM">BM — Cuerpo de Bomberos</option>
                  <option value="TR">TR — Tránsito y Transporte</option>
                  <option value="DC">DC — Defensa Civil</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nueva Contraseña (Opcional)
            </label>
            <input
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Dejar vacío para conservar la contraseña actual"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalEdicionAbierto(false)}
              disabled={guardandoEdicion}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={guardandoEdicion}
              className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold"
            >
              {guardandoEdicion ? 'Actualizando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmación de Baja / Eliminación */}
      <Modal
        isOpen={modalEliminarAbierto}
        onClose={() => setModalEliminarAbierto(false)}
        title="Confirmar Baja / Eliminación de Usuario"
      >
        <div className="space-y-4">
          {errorEliminar && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg">
              {errorEliminar}
            </div>
          )}

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold">Política Institucional de Auditoría Forense (RNF-09):</p>
              <p className="mt-1">
                Si este funcionario ha clasificado, despachado o gestionado incidentes de emergencia en el sistema, la cuenta será <strong>desactivada y renombrada lógicamente</strong> para proteger el registro legal y la cadena de custodia de las emergencias.
              </p>
            </div>
          </div>

          {usuarioEliminando && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
              <p className="text-slate-500 font-medium">Funcionario a procesar:</p>
              <p className="font-bold text-slate-800 text-sm">
                #{usuarioEliminando.id} — {usuarioEliminando.nombre} {usuarioEliminando.apellido}
              </p>
              <p className="text-slate-600 font-mono">{usuarioEliminando.email}</p>
              <p className="text-slate-600">
                Rol: <span className="font-bold">{formatearRol(usuarioEliminando.rol)}</span>
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalEliminarAbierto(false)}
              disabled={eliminando}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmarEliminar}
              disabled={eliminando}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {eliminando ? 'Procesando baja...' : 'Confirmar Baja'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
