/**
 * Componente EmergenciaCard - Tarjeta resumen de una emergencia.
 * Muestra la descripción (truncada), estado, categoría y fecha
 * de una emergencia en un formato compacto y presionable.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Emergencia } from '../types';
import EstadoBadge from './EstadoBadge';
import { Colors, FontSize, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface EmergenciaCardProps {
  /** Datos de la emergencia a mostrar */
  emergencia: Emergencia;
  /** Callback al presionar la tarjeta */
  onPress?: () => void;
}

/**
 * Tarjeta que presenta un resumen visual de una emergencia.
 * Incluye insignia de estado, descripción truncada, fecha
 * y un indicador de categoría si está disponible.
 */
export default function EmergenciaCard({ emergencia, onPress }: EmergenciaCardProps) {
  /** Formatea la fecha de creación de manera legible */
  const fechaFormateada = new Date(emergencia.createdAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  /** Trunca la descripción si excede el límite de caracteres */
  const descripcionCorta =
    emergencia.descripcion.length > 100
      ? emergencia.descripcion.substring(0, 100) + '...'
      : emergencia.descripcion;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Emergencia: ${descripcionCorta}`}
    >
      {/* Cabecera: estado y categoría */}
      <View style={styles.header}>
        <EstadoBadge estado={emergencia.estado} />
        {emergencia.categoria && (
          <Text style={styles.categoria}>
            {emergencia.categoria.replace(/_/g, ' ')}
          </Text>
        )}
      </View>

      {/* Descripción de la emergencia */}
      <Text style={styles.descripcion} numberOfLines={3}>
        {descripcionCorta}
      </Text>

      {/* Pie: fecha e indicador de ubicación */}
      <View style={styles.footer}>
        <View style={styles.fechaContainer}>
          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.fecha}>{fechaFormateada}</Text>
        </View>
        <View style={styles.ubicacionContainer}>
          <Ionicons name="location-outline" size={14} color={Colors.primaryLight} />
          <Text style={styles.ubicacion}>
            {emergencia.latitud.toFixed(4)}, {emergencia.longitud.toFixed(4)}
          </Text>
        </View>
      </View>

      {/* Indicador de evidencia adjunta */}
      {emergencia.evidencia_url && (
        <View style={styles.evidenciaIndicador}>
          <Ionicons name="camera-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.evidenciaTexto}>Evidencia adjunta</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoria: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  descripcion: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fechaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fecha: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  ubicacionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ubicacion: {
    fontSize: FontSize.xs,
    color: Colors.primaryLight,
  },
  evidenciaIndicador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  evidenciaTexto: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
