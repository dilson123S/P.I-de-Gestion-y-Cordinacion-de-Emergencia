import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../src/constants/theme';

export default function PerfilCampoScreen() {
  const router = useRouter();
  const { usuario, logout } = useAuth();

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

        <View style={styles.roleChip}>
          <Ionicons name="medical" size={14} color="#38bdf8" />
          <Text style={styles.roleChipText}>Personal de Respuesta y Rescate</Text>
        </View>
      </View>

      {/* Estado del Turno y Recursos */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Estado de Disponibilidad</Text>
        <View style={styles.shiftRow}>
          <View style={styles.activeDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.shiftTitle}>Guardia Activa</Text>
            <Text style={styles.shiftSub}>Recepción abierta de misiones y despachos</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.unitRow}>
          <Ionicons name="car-sport-outline" size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.unitTitle}>Recurso Móvil</Text>
            <Text style={styles.unitSub}>
              {usuario?.unidad_asignada
                ? `${usuario.unidad_asignada.tipo} - ${usuario.unidad_asignada.codigo || ''}`
                : 'Móvil de Respuesta Rápida'}
            </Text>
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
          <Text style={styles.radioCode}>CH-04 APOYO MÉDICO</Text>
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
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: '#ffffff',
  },
  email: {
    fontSize: FontSize.xs,
    color: '#94a3b8',
    marginTop: 2,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm + 2,
  },
  roleChipText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#38bdf8',
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
  sectionTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
  },
  shiftTitle: {
    fontSize: FontSize.sm + 1,
    fontWeight: '700',
    color: Colors.text,
  },
  shiftSub: {
    fontSize: FontSize.xs,
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
    alignItems: 'center',
    gap: Spacing.sm,
  },
  unitTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  unitSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 6,
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
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  logoutText: {
    color: Colors.danger,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
});
