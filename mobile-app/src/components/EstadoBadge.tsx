/**
 * Componente EstadoBadge - Insignia visual del estado de una emergencia.
 * Muestra el estado con un color de fondo y texto correspondiente
 * según la etapa del ciclo de vida de la emergencia.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EstadoEmergencia } from '../types';
import { Colors, FontSize, BorderRadius, Spacing } from '../constants/theme';

interface EstadoBadgeProps {
  /** Estado de la emergencia a mostrar */
  estado: EstadoEmergencia;
  /** Tamaño de la insignia */
  size?: 'sm' | 'md';
}

/** Mapeo de colores de fondo y texto por estado */
const ESTADO_STYLES: Record<EstadoEmergencia, { bg: string; text: string; label: string }> = {
  [EstadoEmergencia.REPORTADO]: {
    bg: Colors.warningLight,
    text: Colors.warning,
    label: 'Reportado',
  },
  [EstadoEmergencia.CLASIFICADO]: {
    bg: '#eff6ff',
    text: Colors.primary,
    label: 'Clasificado',
  },
  [EstadoEmergencia.ASIGNADO]: {
    bg: Colors.purpleLight,
    text: Colors.purple,
    label: 'Asignado',
  },
  [EstadoEmergencia.EN_ATENCION]: {
    bg: Colors.orangeLight,
    text: Colors.orange,
    label: 'En Atención',
  },
  [EstadoEmergencia.CERRADO]: {
    bg: Colors.successLight,
    text: Colors.success,
    label: 'Cerrado',
  },
};

/**
 * Insignia coloreada que muestra el estado actual de una emergencia.
 * Cada estado tiene un color distintivo para fácil identificación visual.
 */
export default function EstadoBadge({ estado, size = 'md' }: EstadoBadgeProps) {
  const estiloEstado = ESTADO_STYLES[estado] || ESTADO_STYLES[EstadoEmergencia.REPORTADO];
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: estiloEstado.bg },
        isSm && styles.badgeSm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: estiloEstado.text },
          isSm && styles.textSm,
        ]}
      >
        {estiloEstado.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: FontSize.xs,
  },
});
