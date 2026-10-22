import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* ─── Variantes y tamaños del botón ─── */

const variantes = {
  primary:
    'bg-primary-700 text-white hover:bg-primary-800 focus:ring-primary-300',
  secondary:
    'bg-secondary-100 text-secondary-800 hover:bg-secondary-200 focus:ring-secondary-300',
  danger:
    'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-300',
  warning:
    'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-300',
  success:
    'bg-success-600 text-white hover:bg-success-700 focus:ring-success-300',
  ghost:
    'bg-transparent text-secondary-700 hover:bg-secondary-100 focus:ring-secondary-300',
  outline:
    'border border-secondary-300 bg-white text-secondary-700 hover:bg-secondary-50 focus:ring-primary-300',
};

const tamanos = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

/* ─── Interfaz de propiedades del botón ─── */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual del botón */
  variant?: keyof typeof variantes;
  /** Tamaño del botón */
  size?: keyof typeof tamanos;
  /** Muestra un indicador de carga */
  loading?: boolean;
}

/**
 * Componente de botón reutilizable con variantes de estilo.
 * Soporta distintas variantes visuales, tamaños y estado de carga.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          variantes[variant],
          tamanos[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
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
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
