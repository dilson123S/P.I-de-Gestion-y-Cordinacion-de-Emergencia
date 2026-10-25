import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapaEmergencias from '../../src/components/MapaEmergencias';
import { api } from '../../src/lib/api';
import { Colors, FontSize, Spacing } from '../../src/constants/theme';
import { Emergencia } from '../../src/types';

export default function MapaScreen() {
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarEmergencias = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get('/emergencias/mis-reportes');
      const datos = res.data?.datos || res.data;
      if (Array.isArray(datos)) {
        setEmergencias(datos);
      }
    } catch (err) {
      console.warn('Error al cargar emergencias para el mapa:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarEmergencias();
  }, [cargarEmergencias]);

  if (cargando) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.cargandoTexto}>Cargando mapa de incidentes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapaEmergencias emergencias={emergencias} height="100%" />
      <TouchableOpacity style={styles.fabRefresh} onPress={cargarEmergencias}>
        <Ionicons name="refresh" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cargandoTexto: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  fabRefresh: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});
