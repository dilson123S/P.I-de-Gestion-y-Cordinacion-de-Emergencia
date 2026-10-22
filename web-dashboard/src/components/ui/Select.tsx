import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* ─── Interfaz de opciones del select ─── */

interface OpcionSelect {
  /** Valor interno de la opción */
  value: string;
  /** Texto visible para el usuario */
  label: string;
}

/* ─── Interfaz de propiedades del select ─── */

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Etiqueta visible sobre el select */
  label?: string;
  /** Mensaje de error a mostrar debajo */
  error?: string;
  /** Lista de opciones disponibles */
  options: OpcionSelect[];
  /** Texto del placeholder (primera opción deshabilitada) */
  placeholder?: string;
}

/**
 * Componente de selector desplegable con etiqueta y validación.
 * Renderiza un select nativo estilizado con Tailwind.
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, error, options, placeholder, id, ...props },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-secondary-700"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'block w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:bg-secondary-50',
            error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-200',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>
              {opcion.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-danger-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
