import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import EmergenciaCard from '../../src/components/EmergenciaCard';
import { api } from '../../src/lib/api';
import { Colors, Spacing, FontSize } from '../../src/constants/theme';
import { Emergencia } from '../../src/types';

export default function InicioScreen() {
  const router = useRouter();
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarMisReportes = async () => {
    setCargando(true);
    try {
      const res = await api.get('/emergencias/mis-reportes');
      if (res.data?.datos) {
        setEmergencias(res.data.datos);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMisReportes();
  }, []);

  return (
    <View style={styles.container}>
      {emergencias.length === 0 && !cargando ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No tienes reportes activos</Text>
          <Text style={styles.emptySubtitle}>
            Si presencias o tienes una emergencia, pulsa en la pestaña "Reportar SOS" para solicitar auxilio inmediato.
          </Text>
          <TouchableOpacity
            style={styles.sosButton}
            onPress={() => router.push('/(ciudadano)/reportar')}
          >
            <Text style={styles.sosButtonText}>🚨 Reportar Emergencia</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={emergencias}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <EmergenciaCard emergencia={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarMisReportes} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Spacing.md,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  sosButton: {
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 30,
  },
  sosButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: FontSize.md,
  },
});
