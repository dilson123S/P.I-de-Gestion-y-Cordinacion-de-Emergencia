'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { RolUsuario } from '@/types';

/* ─── Definición de elementos del menú ─── */

interface ElementoMenu {
  /** Etiqueta visible del enlace */
  etiqueta: string;
  /** Ruta de navegación */
  ruta: string;
  /** Ícono de Lucide */
  icono: React.ElementType;
  /** Roles que pueden ver este elemento (vacío = todos) */
  roles?: RolUsuario[];
}

const elementosMenu: ElementoMenu[] = [
  {
    etiqueta: 'Dashboard',
    ruta: '/dashboard',
    icono: LayoutDashboard,
  },
  {
    etiqueta: 'Emergencias',
    ruta: '/dashboard/emergencias',
    icono: AlertTriangle,
  },
  {
    etiqueta: 'Mapa en Vivo',
    ruta: '/dashboard/mapa',
    icono: Map,
  },
  {
    etiqueta: 'Unidades',
    ruta: '/dashboard/unidades',
    icono: Truck,
  },
  {
    etiqueta: 'Usuarios',
    ruta: '/dashboard/usuarios',
    icono: Users,
    roles: [RolUsuario.ADMIN],
  },
  {
    etiqueta: 'Catálogo',
    ruta: '/dashboard/catalogo',
    icono: BookOpen,
  },
  {
    etiqueta: 'Auditoría',
    ruta: '/dashboard/auditoria',
    icono: FileText,
  },
];

/**
 * Barra lateral de navegación principal del dashboard.
 * Muestra el logo, los enlaces de navegación y la información del usuario.
 * Es responsiva: se colapsa en dispositivos móviles con un botón hamburguesa.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const { usuario, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  /**
   * Filtra los elementos del menú según el rol del usuario actual.
   * Si un elemento no tiene restricción de roles, es visible para todos.
   */
  const elementosVisibles = elementosMenu.filter((item) => {
    if (!item.roles) return true;
    return usuario && item.roles.includes(usuario.rol);
  });

  /**
   * Determina si una ruta está activa comparando con el pathname actual.
   * La ruta del dashboard solo se activa con coincidencia exacta.
   */
  const esRutaActiva = (ruta: string): boolean => {
    if (ruta === '/dashboard') return pathname === '/dashboard';
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
          'fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-secondary-900 text-white transition-transform duration-300 lg:translate-x-0',
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo y nombre del sistema */}
        <div className="flex items-center gap-3 border-b border-secondary-700 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">SIGEM</h1>
            <p className="text-xs text-secondary-400">
              Gestión de Emergencias
            </p>
          </div>
        </div>

        {/* Enlaces de navegación */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
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
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      activo
                        ? 'bg-primary-700 text-white'
                        : 'text-secondary-300 hover:bg-secondary-800 hover:text-white'
                    )}
                  >
                    <Icono className="h-5 w-5 flex-shrink-0" />
                    {item.etiqueta}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Información del usuario y botón de cerrar sesión */}
        <div className="border-t border-secondary-700 px-4 py-4">
          {usuario && (
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold">
                {usuario.nombre.charAt(0)}
                {usuario.apellido.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {usuario.nombre} {usuario.apellido}
                </p>
                <p className="truncate text-xs text-secondary-400">
                  {usuario.rol}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={cerrarSesion}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-secondary-400 transition-colors hover:bg-secondary-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
