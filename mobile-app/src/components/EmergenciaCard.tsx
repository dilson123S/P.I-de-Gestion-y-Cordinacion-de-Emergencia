/**
 * Componente EmergenciaCard - Tarjeta moderna resumen de una emergencia.
 * Muestra el estado con insignia, tipo de incidente, caso #,
 * descripción, unidad asignada, ubicación y fecha en formato intuitivo.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Emergencia, EstadoEmergencia } from '../types';
import EstadoBadge from './EstadoBadge';
import { Colors, FontSize, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface EmergenciaCardProps {
  /** Datos de la emergencia a mostrar */
  emergencia: Emergencia;
  /** Callback al presionar la tarjeta */
  onPress?: () => void;
}

/** Color lateral según el estado */
const ACCENT_COLORS: Record<EstadoEmergencia, string> = {
  [EstadoEmergencia.REPORTADO]: Colors.warning,
  [EstadoEmergencia.CLASIFICADO]: Colors.primaryLight,
  [EstadoEmergencia.ASIGNADO]: Colors.purple,
  [EstadoEmergencia.EN_ATENCION]: Colors.orange,
  [EstadoEmergencia.CERRADO]: Colors.success,
};

export default function EmergenciaCard({ emergencia, onPress }: EmergenciaCardProps) {
  const fechaOrigen = emergencia.fecha_creacion || emergencia.createdAt;
  const fechaFormateada = fechaOrigen
    ? new Date(fechaOrigen).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Reciente';

  const accentColor = ACCENT_COLORS[emergencia.estado] || Colors.primary;
  const tipoNombre = emergencia.tipo_emergencia?.nombre || emergencia.categoria || 'Emergencia';
  const tipoIcono = emergencia.tipo_emergencia?.icono || '🚨';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Caso número ${emergencia.id}: ${emergencia.descripcion}`}
    >
      {/* Barra de acento visual según estado */}
      <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />

      <View style={styles.cardContent}>
        {/* Cabecera: ID, Tipo y Badge de Estado */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.idBadge}>
              <Text style={styles.idText}>#{emergencia.id}</Text>
            </View>
            <Text style={styles.tipoText} numberOfLines={1}>
              {tipoIcono} {tipoNombre}
            </Text>
          </View>
          <EstadoBadge estado={emergencia.estado} size="sm" />
        </View>

        {/* Descripción */}
        <Text style={styles.descripcion} numberOfLines={2}>
          {emergencia.descripcion}
        </Text>

        {/* Info de Despacho si tiene unidad */}
        {emergencia.unidad && (
          <View style={styles.unidadBanner}>
            <Ionicons name="shield" size={14} color={Colors.purple} />
            <Text style={styles.unidadTexto} numberOfLines={1}>
              Despachada: {emergencia.unidad.tipo} {emergencia.unidad.codigo || emergencia.unidad.nombre || ''}
            </Text>
          </View>
        )}

        {/* Pie con Metadata */}
        <View style={styles.footer}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{fechaFormateada}</Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="location-sharp" size={13} color={Colors.primaryLight} />
            <Text style={styles.metaText}>
              {Number(emergencia.latitud).toFixed(3)}, {Number(emergencia.longitud).toFixed(3)}
            </Text>
          </View>

          {emergencia.evidencia_url && (
            <View style={styles.metaItem}>
              <Ionicons name="image-outline" size={13} color={Colors.success} />
              <Text style={[styles.metaText, { color: Colors.success, fontWeight: '600' }]}>Foto</Text>
            </View>
          )}

          {onPress && (
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} style={styles.chevron} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  accentStrip: {
    width: 5,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    flex: 1,
    marginRight: Spacing.xs,
  },
  idBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  idText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.text,
  },
  tipoText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    flexShrink: 1,
  },
  descripcion: {
    fontSize: FontSize.sm,
    color: '#334155',
    lineHeight: 19,
    marginBottom: Spacing.sm,
  },
  unidadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  unidadTexto: {
    fontSize: FontSize.xs,
    color: '#5b21b6',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.md,
    paddingTop: Spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  chevron: {
    marginLeft: 'auto',
  },
});
