import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilidad para combinar clases de Tailwind de forma segura.
 * Fusiona clases condicionales y resuelve conflictos automáticamente.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea una fecha ISO a formato legible en español.
 * @param fecha - Cadena de fecha ISO 8601
 * @returns Fecha formateada (ej: "22 oct 2024, 14:30")
 */
export function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return '—';
  const date = new Date(fecha);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Trunca un texto a una longitud máxima añadiendo puntos suspensivos.
 * @param texto - Texto original
 * @param longitud - Longitud máxima antes de truncar
 */
export function truncarTexto(texto: string, longitud: number = 60): string {
  if (texto.length <= longitud) return texto;
  return texto.substring(0, longitud) + '...';
}

/**
 * Obtiene las iniciales de un nombre completo (máximo 2 caracteres).
 * @param nombre - Nombre del usuario
 * @param apellido - Apellido del usuario
 */
export function obtenerIniciales(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

/**
 * Mapeo de colores para las prioridades de emergencia.
 * Retorna clases de Tailwind para badge/texto.
 */
export function colorPrioridad(prioridad: string | null | undefined): string {
  switch (prioridad) {
    case 'CRITICA':
      return 'bg-danger-100 text-danger-700 border-danger-300';
    case 'ALTA':
      return 'bg-orange-100 text-orange-700 border-orange-300';
    case 'MEDIA':
      return 'bg-warning-100 text-warning-700 border-warning-300';
    case 'BAJA':
      return 'bg-success-100 text-success-700 border-success-300';
    default:
      return 'bg-secondary-100 text-secondary-600 border-secondary-300';
  }
}
