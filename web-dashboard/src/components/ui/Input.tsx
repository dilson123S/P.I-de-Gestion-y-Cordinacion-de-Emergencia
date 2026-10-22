import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* ─── Interfaz de propiedades del input ─── */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Etiqueta visible sobre el input */
  label?: string;
  /** Mensaje de error a mostrar debajo del input */
  error?: string;
}

/**
 * Componente de campo de entrada con soporte para etiqueta y errores.
 * Se integra con formularios y muestra validación visual.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-secondary-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:bg-secondary-50 disabled:text-secondary-500',
            error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-200',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-danger-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
