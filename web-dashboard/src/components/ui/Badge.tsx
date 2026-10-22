import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/* ─── Variantes visuales del badge ─── */

const variantes = {
  default: 'bg-secondary-100 text-secondary-700 border-secondary-300',
  primary: 'bg-primary-100 text-primary-700 border-primary-300',
  danger: 'bg-danger-100 text-danger-700 border-danger-300',
  warning: 'bg-warning-100 text-warning-700 border-warning-300',
  success: 'bg-success-100 text-success-700 border-success-300',
  purple: 'bg-purple-100 text-purple-700 border-purple-300',
  orange: 'bg-orange-100 text-orange-700 border-orange-300',
};

/* ─── Interfaz de propiedades ─── */

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Variante de color del badge */
  variant?: keyof typeof variantes;
}

/**
 * Componente badge/etiqueta para mostrar estados y categorías.
 * Pequeña etiqueta con color de fondo y borde para indicar estado.
 */
function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variantes[variant],
        className
      )}
      {...props}
    />
  );
}

export default Badge;
