import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { RolUsuario } from '../../src/types';

export default function CiudadanoLayout() {
  const router = useRouter();
  const { estaAutenticado, estaCargando, usuario } = useAuth();

  useEffect(() => {
    if (!estaCargando) {
      if (!estaAutenticado) {
        router.replace('/(auth)/login');
      } else if (usuario && usuario.rol !== RolUsuario.CIUDADANO) {
        if (usuario.rol === RolUsuario.PERSONAL_CAMPO) {
          router.replace('/(campo)/asignaciones');
        } else {
          router.replace('/(auth)/login');
        }
      }
    }
  }, [estaAutenticado, estaCargando, usuario, router]);

  if (estaCargando || !estaAutenticado || (usuario && usuario.rol !== RolUsuario.CIUDADANO)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Verificando acceso ciudadano...</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 1,
          shadowOpacity: 0.05,
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          color: Colors.text,
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          height: Platform.OS === 'ios' ? 86 : 64,
          paddingBottom: Platform.OS === 'ios' ? 26 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Mis Reportes',
          tabBarIcon: ({ focused, size }) => <Ionicons name="newspaper-outline" size={size} color={focused ? '#1e40af' : '#94a3b8'} />,
        }}
      />
      <Tabs.Screen
        name="reportar"
        options={{
          title: 'Reportar SOS',
          tabBarLabelStyle: { fontWeight: '800', color: Colors.danger },
          tabBarIcon: ({ focused }) => (
            <View style={[styles.sosTabIcon, focused && styles.sosTabIconFocused]}>
              <Ionicons name="radio" size={24} color="#ffffff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ focused, size }) => <Ionicons name="map-outline" size={size} color={focused ? '#1e40af' : '#94a3b8'} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Mi Perfil',
          tabBarIcon: ({ focused, size }) => <Ionicons name="person-outline" size={size} color={focused ? '#1e40af' : '#94a3b8'} />,
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
    backgroundColor: '#ffffff',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  sosTabIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 4 : 8,
    shadowColor: Colors.danger,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  sosTabIconFocused: {
    transform: [{ scale: 1.08 }],
    backgroundColor: '#b91c1c',
  },
});
