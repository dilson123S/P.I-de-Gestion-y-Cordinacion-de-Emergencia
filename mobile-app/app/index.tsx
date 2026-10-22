import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { RolUsuario } from '../src/types';
import { Colors } from '../src/constants/theme';

export default function IndexScreen() {
  const router = useRouter();
  const { usuario, estaAutenticado, estaCargando } = useAuth();

  useEffect(() => {
    if (!estaCargando) {
      if (!estaAutenticado) {
        router.replace('/(auth)/login');
      } else if (usuario?.rol === RolUsuario.PERSONAL_CAMPO) {
        router.replace('/(campo)/asignaciones');
      } else {
        router.replace('/(ciudadano)/inicio');
      }
    }
  }, [estaAutenticado, estaCargando, usuario, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
