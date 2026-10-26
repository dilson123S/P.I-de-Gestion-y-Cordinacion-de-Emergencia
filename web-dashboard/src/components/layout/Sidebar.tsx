'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  AlertTriangle,
  Map,
  Truck,
  Users,
  BookOpen,
  FileText,
  LogOut,
  Shield,
  Menu,
  X,
  PhoneCall,
  Radio,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { RolUsuario, formatearRol } from '@/types';

/* ─── Definición de elementos del menú con Control de Acceso (RBAC) ─── */

interface ElementoMenu {
  /** Etiqueta visible del enlace */
  etiqueta: string;
  /** Ruta de navegación */
  ruta: string;
  /** Ícono de Lucide */
  icono: React.ElementType;
  /** Roles autorizados para visualizar esta opción (vacío = público institucional) */
  roles?: (RolUsuario | string)[];
  /** Insignia o descriptor opcional */
  badge?: string;
}

const ROLES_OPERACION_CENTRAL = [
  RolUsuario.OPERADOR,
  RolUsuario.DESPACHADOR,
  RolUsuario.OPERADOR_INTEGRAL,
  RolUsuario.ADMIN,
  'OPERADOR',
  'DESPACHADOR',
  'OPERADOR_INTEGRAL',
  'ADMIN',
];

const elementosMenu: ElementoMenu[] = [
  // 1. Consola Principal (Adaptativa según el rol activo)
  {
    etiqueta: 'Consola Principal',
    ruta: '/dashboard',
    icono: LayoutDashboard,
  },
  // 2. Operador CAD: Mesa de Triage (Recepción y tipificación de incidentes)
  {
    etiqueta: 'Mesa de Triage',
    ruta: '/dashboard/emergencias?estado=REPORTADO',
    icono: PhoneCall,
    roles: ROLES_OPERACION_CENTRAL,
    badge: 'Triage',
  },
  // 3. Operador CAD: Mesa de Despacho (Asignación táctica de recursos)
  {
    etiqueta: 'Mesa de Despacho',
    ruta: '/dashboard/emergencias?estado=CLASIFICADO',
    icono: Radio,
    roles: ROLES_OPERACION_CENTRAL,
    badge: 'Despacho',
  },
  // 4. Mapa Táctico en Vivo (Monitoreo geográfico)
  {
    etiqueta: 'Mapa Táctico en Vivo',
    ruta: '/dashboard/mapa',
    icono: Map,
    roles: ROLES_OPERACION_CENTRAL,
  },
  // 5. Flota de Unidades (Disponibilidad y estado operativo)
  {
    etiqueta: 'Flota de Unidades',
    ruta: '/dashboard/unidades',
    icono: Truck,
    roles: ROLES_OPERACION_CENTRAL,
  },
  // 6. Registro Histórico de Emergencias (Supervisión completa)
  {
    etiqueta: 'Historial de Incidentes',
    ruta: '/dashboard/emergencias',
    icono: AlertTriangle,
    roles: [RolUsuario.ADMIN, 'ADMIN'],
  },
  // 7. Catálogo Administrable (RF-09)
  {
    etiqueta: 'Catálogo de Emergencias',
    ruta: '/dashboard/catalogo',
    icono: BookOpen,
    roles: [RolUsuario.ADMIN, 'ADMIN'],
  },
  // 8. Trazabilidad e Inmutabilidad (RNF-09)
  {
    etiqueta: 'Log de Auditoría',
    ruta: '/dashboard/auditoria',
    icono: FileText,
    roles: [RolUsuario.ADMIN, 'ADMIN'],
  },
  // 9. Administración de Actores
  {
    etiqueta: 'Gestión de Personal',
    ruta: '/dashboard/usuarios',
    icono: Users,
    roles: [RolUsuario.ADMIN, 'ADMIN'],
  },
];

/**
 * Barra lateral de navegación institucional del dashboard (SIGEM).
 * Aplica segregación estricta de funciones por rol (RBAC) para eliminar ruido visual
 * y garantizar foco operativo en situaciones de emergencia.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { usuario, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const rutaCompleta = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;

  /**
   * Filtra los elementos del menú según el rol operativo del usuario.
   * Evita sobrecarga cognitiva ocultando herramientas fuera del alcance del puesto de trabajo.
   */
  const elementosVisibles = elementosMenu.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    if (!usuario) return false;
    return item.roles.some((r) => String(r) === String(usuario.rol));
  });

  /**
   * Determina con exactitud si un enlace debe resaltarse como activo.
   */
  const esRutaActiva = (ruta: string): boolean => {
    if (ruta.includes('?')) {
      return rutaCompleta === ruta;
    }
    if (ruta === '/dashboard') return pathname === '/dashboard';
    if (ruta === '/dashboard/emergencias') {
      return pathname === '/dashboard/emergencias' && (!searchParams || searchParams.toString() === '');
    }
    return pathname.startsWith(ruta);
  };

  return (
    <>
      {/* Botón hamburguesa para móviles */}
      <button
        onClick={() => setMenuAbierto(!menuAbierto)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-secondary-900 p-2 text-white shadow-lg lg:hidden"
        aria-label="Menú de navegación"
      >
        {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay para cerrar el menú en móviles */}
      {menuAbierto && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-slate-900 text-white transition-transform duration-300 lg:translate-x-0 border-r border-slate-800 shadow-xl',
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo y membrete institucional */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-5 bg-slate-950/40">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold tracking-wider text-slate-100 font-mono">SIGEM</h1>
              <span className="rounded bg-blue-950 px-1.5 py-0.2 text-[10px] font-semibold text-blue-300 border border-blue-800/60">
                123
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Coordinación de Emergencias
            </p>
          </div>
        </div>

        {/* Estación de trabajo activa */}
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800/80">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Puesto de Operación
          </p>
          <p className="text-xs font-bold text-slate-200 mt-0.5 truncate">
            {usuario ? formatearRol(usuario.rol) : 'Sesión Activa'}
          </p>
        </div>

        {/* Enlaces de navegación segregados por puesto */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <ul className="space-y-1">
            {elementosVisibles.map((item) => {
              const Icono = item.icono;
              const activo = esRutaActiva(item.ruta);

              return (
                <li key={item.ruta}>
                  <Link
                    href={item.ruta}
                    onClick={() => setMenuAbierto(false)}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      activo
                        ? 'bg-blue-600 text-white shadow-sm font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icono className={cn('h-4 w-4 flex-shrink-0', activo ? 'text-white' : 'text-slate-400')} />
                      <span className="truncate">{item.etiqueta}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded font-mono font-bold tracking-tight',
                          activo
                            ? 'bg-blue-700 text-blue-100'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Información del operador de turno y botón de cierre seguro */}
        <div className="border-t border-slate-800 bg-slate-950/40 p-4">
          {usuario && (
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700">
                {usuario.nombre.charAt(0)}
                {usuario.apellido.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {usuario.nombre} {usuario.apellido}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    String(usuario.rol) === 'ADMIN'
                      ? 'bg-slate-700 text-slate-200'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {formatearRol(usuario.rol)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={cerrarSesion}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-red-950/40 hover:border-red-900/60 hover:text-red-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Finalizar Turno / Salir
          </button>
        </div>
      </aside>
    </>
  );
}
