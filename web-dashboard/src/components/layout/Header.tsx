'use client';

import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Encabezado superior del dashboard.
 * Muestra barra de búsqueda, notificaciones y la información del usuario.
 */
export default function Header() {
  const { usuario } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-secondary-200 bg-white px-6">
      {/* Barra de búsqueda */}
      <div className="flex flex-1 items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            placeholder="Buscar emergencias, unidades..."
            className="w-full rounded-lg border border-secondary-200 bg-secondary-50 py-2 pl-10 pr-4 text-sm text-secondary-700 placeholder:text-secondary-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
      </div>

      {/* Acciones del encabezado */}
      <div className="flex items-center gap-4">
        {/* Botón de notificaciones */}
        <button className="relative rounded-lg p-2 text-secondary-500 transition-colors hover:bg-secondary-100 hover:text-secondary-700">
          <Bell className="h-5 w-5" />
          {/* Indicador de notificaciones pendientes */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500" />
        </button>

        {/* Información del usuario */}
        {usuario && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-secondary-900">
                {usuario.nombre} {usuario.apellido}
              </p>
              <p className="text-xs text-secondary-500">{usuario.rol}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
              {usuario.nombre.charAt(0)}
              {usuario.apellido.charAt(0)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
