'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Interfaz de propiedades del modal ─── */

interface ModalProps {
  /** Controla la visibilidad del modal (soporta 'abierto' o 'isOpen') */
  abierto?: boolean;
  isOpen?: boolean;
  /** Función para cerrar el modal (soporta 'onCerrar' o 'onClose') */
  onCerrar?: () => void;
  onClose?: () => void;
  /** Título del encabezado del modal (soporta 'titulo' o 'title') */
  titulo?: string;
  title?: string;
  /** Contenido del modal */
  children: ReactNode;
  /** Clase CSS adicional para el contenedor */
  className?: string;
  /** Tamaño del modal */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/** Mapeo de anchos según el tamaño */
const tamanos = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Componente modal centrado con overlay oscuro.
 * Se cierra al presionar Escape o hacer clic fuera del contenido.
 */
export default function Modal({
  abierto,
  isOpen,
  onCerrar,
  onClose,
  titulo,
  title,
  children,
  className,
  size = 'md',
}: ModalProps) {
  const visible = isOpen !== undefined ? isOpen : (abierto ?? false);
  const handleClose = onClose || onCerrar || (() => {});
  const displayTitle = title || titulo || '';

  /** Cierra el modal al presionar la tecla Escape */
  useEffect(() => {
    const manejarEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    if (visible) {
      document.addEventListener('keydown', manejarEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', manejarEscape);
      document.body.style.overflow = 'unset';
    };
  }, [visible, handleClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay oscuro — clic para cerrar */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Contenido del modal */}
      <div
        className={cn(
          'relative z-10 w-full rounded-xl bg-white shadow-2xl',
          tamanos[size],
          className
        )}
      >
        {/* Encabezado con título y botón de cerrar */}
        <div className="flex items-center justify-between border-b border-secondary-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-secondary-900">
            {displayTitle}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
