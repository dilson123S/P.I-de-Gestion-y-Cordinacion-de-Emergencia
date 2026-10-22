import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/theme';

export default function CampoLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="asignaciones"
        options={{
          title: 'Mis Asignaciones',
          tabBarIcon: ({ color, size }) => <Ionicons name="clipboard" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="detalle/[id]"
        options={{
          href: null, // Ocultar de la barra de pestañas
          title: 'Detalle de Misión',
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil Operativo',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
