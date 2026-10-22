import { cn } from '@/lib/utils';

/* ─── Interfaz de propiedades ─── */

interface LoadingProps {
  /** Texto descriptivo mostrado junto al spinner */
  texto?: string;
  /** Clase CSS adicional */
  className?: string;
  /** Tamaño del spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Si ocupa toda la pantalla */
  fullScreen?: boolean;
}

/** Mapeo de tamaños del spinner */
const tamanos = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

/**
 * Componente de indicador de carga con spinner animado.
 * Puede mostrarse en línea o como overlay de pantalla completa.
 */
export default function Loading({
  texto = 'Cargando...',
  className,
  size = 'md',
  fullScreen = false,
}: LoadingProps) {
  const contenido = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <svg
        className={cn('animate-spin text-primary-600', tamanos[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {texto && (
        <p className="text-sm font-medium text-secondary-500">{texto}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary-50">
        {contenido}
      </div>
    );
  }

  return contenido;
}
