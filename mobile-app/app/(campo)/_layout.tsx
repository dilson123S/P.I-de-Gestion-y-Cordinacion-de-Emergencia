import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { RolUsuario } from '../../src/types';

export default function CampoLayout() {
  const router = useRouter();
  const { estaAutenticado, estaCargando, usuario } = useAuth();

  useEffect(() => {
    if (!estaCargando) {
      if (!estaAutenticado) {
        router.replace('/(auth)/login');
      } else if (usuario && usuario.rol !== RolUsuario.PERSONAL_CAMPO) {
        if (usuario.rol === RolUsuario.CIUDADANO) {
          router.replace('/(ciudadano)/inicio');
        } else {
          router.replace('/(auth)/login');
        }
      }
    }
  }, [estaAutenticado, estaCargando, usuario, router]);

  if (estaCargando || !estaAutenticado || (usuario && usuario.rol !== RolUsuario.PERSONAL_CAMPO)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Verificando credencial de despacho táctico...</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1d4ed8',
        tabBarInactiveTintColor: '#64748b',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0f172a',
          elevation: 2,
          shadowOpacity: 0.1,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          color: '#ffffff',
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          height: Platform.OS === 'ios' ? 86 : 64,
          paddingBottom: Platform.OS === 'ios' ? 26 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="asignaciones"
        options={{
          title: 'Misiones Activas',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={focused ? '#1d4ed8' : '#64748b'} />
          ),
        }}
      />
      <Tabs.Screen
        name="detalle/[id]"
        options={{
          href: null, // Ocultar de la barra de navegación inferior
          title: 'Control de Misión',
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Unidad y Turno',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="shield-outline" size={size} color={focused ? '#1d4ed8' : '#64748b'} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
