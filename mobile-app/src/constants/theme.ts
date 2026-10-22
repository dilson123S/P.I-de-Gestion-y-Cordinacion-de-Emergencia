/**
 * Tema visual de la aplicación SIGEM - Emergencias
 * Paleta de colores, tipografía y espaciado consistente
 * para una interfaz profesional orientada a emergencias.
 */

/** Paleta de colores principal de la aplicación */
export const Colors = {
  /** Azul institucional principal */
  primary: '#1e40af',
  /** Azul claro para elementos secundarios */
  primaryLight: '#3b82f6',
  /** Rojo para alertas y botones de emergencia */
  danger: '#dc2626',
  /** Rojo claro para fondos de alerta */
  dangerLight: '#fef2f2',
  /** Amarillo para advertencias */
  warning: '#f59e0b',
  /** Amarillo claro para fondos de advertencia */
  warningLight: '#fffbeb',
  /** Verde para estados exitosos */
  success: '#16a34a',
  /** Verde claro para fondos exitosos */
  successLight: '#f0fdf4',
  /** Púrpura para estado asignado */
  purple: '#7c3aed',
  /** Púrpura claro para fondos de asignación */
  purpleLight: '#f5f3ff',
  /** Naranja para estado en atención */
  orange: '#ea580c',
  /** Naranja claro para fondos de atención */
  orangeLight: '#fff7ed',
  /** Fondo general de la app */
  background: '#f8fafc',
  /** Superficie de tarjetas y contenedores */
  surface: '#ffffff',
  /** Color de texto principal */
  text: '#0f172a',
  /** Color de texto secundario */
  textSecondary: '#64748b',
  /** Color de bordes */
  border: '#e2e8f0',
  /** Fondo de inputs */
  inputBackground: '#f1f5f9',
} as const;

/** Sistema de espaciado consistente (múltiplos de 4px) */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Tamaños de fuente estandarizados */
export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  title: 32,
} as const;

/** Radios de borde para componentes */
export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

/** Sombras para elevación de componentes (iOS y Android) */
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;
