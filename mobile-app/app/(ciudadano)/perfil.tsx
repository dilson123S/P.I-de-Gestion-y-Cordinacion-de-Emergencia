import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../src/constants/theme';

export default function PerfilScreen() {
  const router = useRouter();
  const { usuario, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const llamarNumero = (tel: string) => {
    Linking.openURL(`tel:${tel}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tarjeta de Identificación del Usuario */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={42} color={Colors.primary} />
        </View>
        <Text style={styles.name}>
          {usuario?.nombre} {usuario?.apellido}
        </Text>
        <Text style={styles.email}>{usuario?.email}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
          <Text style={styles.roleText}>{usuario?.rol || 'CIUDADANO'}</Text>
        </View>
      </View>

      {/* Datos Personales Registrados */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Datos de Contacto</Text>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={18} color={Colors.textSecondary} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Teléfono</Text>
            <Text style={styles.infoValue}>{usuario?.telefono || 'No registrado'}</Text>
          </View>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Correo Electrónico</Text>
            <Text style={styles.infoValue}>{usuario?.email}</Text>
          </View>
        </View>
      </View>

      {/* Líneas de Auxilio Rápido */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Líneas Directas de Auxilio</Text>
        <View style={styles.emergencyGrid}>
          <TouchableOpacity
            style={styles.emergencyDialBtn}
            onPress={() => llamarNumero('911')}
          >
            <Ionicons name="call" size={18} color={Colors.danger} />
            <Text style={styles.emergencyDialNumber}>911</Text>
            <Text style={styles.emergencyDialLabel}>Emergencias</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emergencyDialBtn}
            onPress={() => llamarNumero('118')}
          >
            <Ionicons name="shield" size={18} color={Colors.primary} />
            <Text style={styles.emergencyDialNumber}>118</Text>
            <Text style={styles.emergencyDialLabel}>Policía</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emergencyDialBtn}
            onPress={() => llamarNumero('115')}
          >
            <Ionicons name="flame" size={18} color={Colors.warning} />
            <Text style={styles.emergencyDialNumber}>115</Text>
            <Text style={styles.emergencyDialLabel}>Bomberos</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Información del Sistema */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Acerca de SIGEM</Text>
        <Text style={styles.aboutText}>
          Plataforma de Gestión y Coordinación de Emergencias con Registro Único de Datos (RNF-07).
          Tus datos fluyen directamente a la central de despacho para una respuesta coordinada.
        </Text>
        <Text style={styles.versionText}>Versión 1.0.0 Móvil</Text>
      </View>

      {/* Botón de Cerrar Sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
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
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  email: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  roleText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionCard: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    paddingVertical: 4,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: Spacing.xs,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSize.xs - 1,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 1,
  },
  emergencyGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  emergencyDialBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emergencyDialNumber: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 4,
  },
  emergencyDialLabel: {
    fontSize: FontSize.xs - 2,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  versionText: {
    fontSize: FontSize.xs - 2,
    color: '#94a3b8',
    marginTop: Spacing.sm,
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
