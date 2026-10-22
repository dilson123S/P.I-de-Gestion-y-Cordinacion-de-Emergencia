'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';

/**
 * Barra de navegación superior para páginas públicas (ej: login).
 * Muestra el logo y nombre del sistema con enlace al inicio.
 */
export default function Navbar() {
  return (
    <nav className="flex h-16 items-center justify-between border-b border-secondary-200 bg-white px-6 shadow-sm">
      {/* Logo y nombre del sistema */}
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-700">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-secondary-900">SIGEM</h1>
          <p className="text-[10px] leading-tight text-secondary-500">
            Sistema de Gestión de Emergencias
          </p>
        </div>
      </Link>
    </nav>
  );
}
