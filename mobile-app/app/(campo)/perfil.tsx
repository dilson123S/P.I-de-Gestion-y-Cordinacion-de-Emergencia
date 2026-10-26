import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../src/constants/theme';

export default function PerfilCampoScreen() {
  const router = useRouter();
  const { usuario, logout, refrescarPerfil } = useAuth();
  const [refrescando, setRefrescando] = useState(false);

  const sincronizar = useCallback(async () => {
    setRefrescando(true);
    try {
      await refrescarPerfil();
    } finally {
      setRefrescando(false);
    }
  }, [refrescarPerfil]);

  useEffect(() => {
    sincronizar();
  }, [sincronizar]);

  const handleLogout = () => {
    Alert.alert('Finalizar Turno', '¿Confirmas la entrega de turno y cierre de sesión operativa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar Guardia',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const unidad = usuario?.unidad_asignada;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refrescando} onRefresh={sincronizar} colors={[Colors.primary]} />
      }
    >
      {/* Credencial Operativa */}
      <View style={styles.cardCredential}>
        <View style={styles.badgeTop}>
          <Text style={styles.badgeTopText}>CREDENCIAL DE CAMPO SIGEM</Text>
        </View>

        <View style={styles.avatar}>
          <Ionicons name="shield" size={44} color="#ffffff" />
        </View>

        <Text style={styles.name}>
          {usuario?.nombre} {usuario?.apellido}
        </Text>
        <Text style={styles.email}>{usuario?.email}</Text>

        {unidad ? (
          <View style={styles.roleChipUnit}>
            <Ionicons name="car-sport" size={14} color="#60a5fa" />
            <Text style={styles.roleChipUnitText}>
              Unidad Oficial [{unidad.codigo}] • {unidad.tipo.split('-')[0].trim()}
            </Text>
          </View>
        ) : (
          <View style={styles.roleChip}>
            <Ionicons name="medical" size={14} color="#38bdf8" />
            <Text style={styles.roleChipText}>Personal de Respuesta y Rescate</Text>
          </View>
        )}
      </View>

      {/* Estado del Turno y Recursos */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Estado de Disponibilidad Táctica</Text>
          <TouchableOpacity onPress={sincronizar} style={styles.refreshIconBtn} disabled={refrescando}>
            <Ionicons name="refresh" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.shiftRow}>
          <View style={styles.activeDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.shiftTitle}>Guardia Activa</Text>
            <Text style={styles.shiftSub}>Recepción abierta de misiones y órdenes de despacho (CAD 123)</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.unitRow}>
          <View style={styles.unitIconContainer}>
            <Ionicons name="car-sport" size={24} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.unitHeaderRow}>
              <Text style={styles.unitTitle}>Recurso Móvil Asignado</Text>
              {unidad && (
                <View style={styles.statusPillGreen}>
                  <Text style={styles.statusPillGreenText}>{unidad.estado || 'DISPONIBLE'}</Text>
                </View>
              )}
            </View>

            {unidad ? (
              <View style={styles.unitDataBox}>
                <Text style={styles.unitCode}>
                  [{unidad.codigo}] {unidad.tipo}
                </Text>
                <Text style={styles.unitSub}>
                  Placa Oficial: <Text style={styles.unitBold}>{unidad.placa || 'En trámite'}</Text>
                </Text>
                {unidad.latitud_actual && unidad.longitud_actual && (
                  <Text style={styles.unitCoords}>
                    📍 Base GPS: {unidad.latitud_actual.toFixed(4)}, {unidad.longitud_actual.toFixed(4)}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.unitSubPending}>
                Sin unidad vinculada. El Administrador asignará tu unidad con sigla y correlativo desde la Consola Central.
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Canales de Coordinación Radial */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Frecuencias de Coordinación</Text>
        <View style={styles.radioRow}>
          <Ionicons name="radio-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.radioText}>Canal Central: </Text>
          <Text style={styles.radioCode}>CH-01 EMERGENCIAS (VHF 154.280)</Text>
        </View>
        <View style={styles.radioRow}>
          <Ionicons name="cellular-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.radioText}>Despacho Táctico: </Text>
          <Text style={styles.radioCode}>CH-04 APOYO MÉDICO / POLICIAL</Text>
        </View>
      </View>

      {/* Botón de Finalizar Turno */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="power-outline" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Finalizar Guardia y Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  cardCredential: {
    backgroundColor: '#0f172a',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  badgeTop: {
    backgroundColor: '#1e293b',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  badgeTopText: {
    color: '#94a3b8',
    fontSize: FontSize.xs - 2,
    fontWeight: '800',
    letterSpacing: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 3,
    borderColor: '#38bdf8',
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  email: {
    fontSize: FontSize.xs,
    color: '#94a3b8',
    marginTop: 2,
    marginBottom: Spacing.md,
    fontFamily: 'monospace',
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleChipText: {
    color: '#e2e8f0',
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  roleChipUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e3a8a',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  roleChipUnitText: {
    color: '#93c5fd',
    fontSize: FontSize.xs,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: '800',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refreshIconBtn: {
    padding: 4,
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
  },
  shiftTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  shiftSub: {
    fontSize: FontSize.xs - 1,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: Spacing.sm,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  unitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  unitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  statusPillGreen: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusPillGreenText: {
    fontSize: FontSize.xs - 2,
    color: '#065f46',
    fontWeight: '800',
  },
  unitDataBox: {
    marginTop: 4,
  },
  unitCode: {
    fontSize: FontSize.sm + 1,
    fontWeight: '800',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  unitSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  unitBold: {
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  unitCoords: {
    fontSize: FontSize.xs - 1,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 3,
  },
  unitSubPending: {
    fontSize: FontSize.xs,
    color: '#b45309',
    marginTop: 2,
    fontStyle: 'italic',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  radioText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  radioCode: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    marginTop: Spacing.sm,
    ...Shadows.sm,
  },
  logoutText: {
    color: Colors.danger,
    fontSize: FontSize.xs + 1,
    fontWeight: '700',
  },
});
