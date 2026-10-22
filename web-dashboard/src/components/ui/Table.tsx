import { type ReactNode, type ThHTMLAttributes, type TdHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* ─── Componente Table principal ─── */

interface TableProps {
  children: ReactNode;
  className?: string;
}

/**
 * Tabla responsiva con estilos consistentes.
 * Envuelve los datos tabulares en un contenedor con scroll horizontal.
 */
function Table({ children, className }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn('w-full text-left text-sm text-secondary-700', className)}
      >
        {children}
      </table>
    </div>
  );
}

/* ─── Subcomponentes de la tabla ─── */

/** Encabezado de la tabla */
function TableHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <thead
      className={cn(
        'border-b border-secondary-200 bg-secondary-50 text-xs uppercase text-secondary-600',
        className
      )}
    >
      {children}
    </thead>
  );
}

/** Cuerpo de la tabla */
function TableBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <tbody className={cn('divide-y divide-secondary-100', className)}>{children}</tbody>;
}

/** Fila de la tabla */
function TableRow({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      className={cn(
        'transition-colors hover:bg-secondary-50',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

/** Celda de encabezado */
function TableHead({
  children,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <th
      className={cn('px-4 py-3 font-semibold', className)}
      {...props}
    >
      {children}
    </th>
  );
}

/** Celda de datos */
function TableCell({
  children,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <td className={cn('px-4 py-3', className)} {...props}>
      {children}
    </td>
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
export default Table;
