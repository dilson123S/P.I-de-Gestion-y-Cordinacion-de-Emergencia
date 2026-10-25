/**
 * Componente EstadoBadge - Insignia visual del estado de una emergencia.
 * Muestra el estado con color de fondo, borde, ícono distintivo y texto.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EstadoEmergencia } from '../types';
import { Colors, FontSize, BorderRadius, Spacing } from '../constants/theme';

interface EstadoBadgeProps {
  /** Estado de la emergencia a mostrar */
  estado: EstadoEmergencia;
  /** Tamaño de la insignia */
  size?: 'sm' | 'md';
  /** Ocultar ícono opcionalmente */
  showIcon?: boolean;
}

/** Configuración de estilo, texto e ícono por estado */
const ESTADO_CONFIG: Record<
  EstadoEmergencia,
  { bg: string; border: string; text: string; label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  [EstadoEmergencia.REPORTADO]: {
    bg: '#fef3c7',
    border: '#fde68a',
    text: '#b45309',
    label: 'Reportado',
    icon: 'time-outline',
  },
  [EstadoEmergencia.CLASIFICADO]: {
    bg: '#dbeafe',
    border: '#bfdbfe',
    text: '#1d4ed8',
    label: 'Clasificado',
    icon: 'git-network-outline',
  },
  [EstadoEmergencia.ASIGNADO]: {
    bg: '#ede9fe',
    border: '#ddd6fe',
    text: '#6d28d9',
    label: 'Unidad Asignada',
    icon: 'shield-outline',
  },
  [EstadoEmergencia.EN_ATENCION]: {
    bg: '#ffedd5',
    border: '#fed7aa',
    text: '#c2410c',
    label: 'En Atención',
    icon: 'flash-outline',
  },
  [EstadoEmergencia.CERRADO]: {
    bg: '#dcfce7',
    border: '#bbf7d0',
    text: '#15803d',
    label: 'Cerrado',
    icon: 'checkmark-circle-outline',
  },
};

export default function EstadoBadge({
  estado,
  size = 'md',
  showIcon = true,
}: EstadoBadgeProps) {
  const config = ESTADO_CONFIG[estado] || ESTADO_CONFIG[EstadoEmergencia.REPORTADO];
  const isSm = size === 'sm';
  const iconSize = isSm ? 11 : 13;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        isSm && styles.badgeSm,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      {showIcon && (
        <Ionicons
          name={config.icon}
          size={iconSize}
          color={config.text}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          { color: config.text },
          isSm && styles.textSm,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: FontSize.xs - 2,
  },
});
