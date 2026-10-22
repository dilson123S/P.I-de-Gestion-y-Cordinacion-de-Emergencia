import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import EstadoBadge from '../../src/components/EstadoBadge';
import { api } from '../../src/lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { Emergencia } from '../../src/types';

export default function AsignacionesScreen() {
  const router = useRouter();
  const [asignaciones, setAsignaciones] = useState<Emergencia[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarAsignaciones = async () => {
    setCargando(true);
    try {
      const res = await api.get('/emergencias?limite=20');
      if (res.data?.datos?.emergencias) {
        // En un caso de campo, filtramos las asignadas o en atención
        const activas = res.data.datos.emergencias.filter(
          (e: Emergencia) => e.estado === 'ASIGNADO' || e.estado === 'EN_ATENCION'
        );
        setAsignaciones(activas);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAsignaciones();
  }, []);

  return (
    <View style={styles.container}>
      {asignaciones.length === 0 && !cargando ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sin misiones asignadas</Text>
          <Text style={styles.emptySubtitle}>
            Actualmente tu unidad no tiene despachos activos en curso. Permanece en alerta.
          </Text>
        </View>
      ) : (
        <FlatList
          data={asignaciones}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarAsignaciones} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(campo)/detalle/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardId}>Caso #{item.id}</Text>
                <EstadoBadge estado={item.estado} />
              </View>
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.descripcion}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardTipo}>
                  {item.tipo_emergencia?.icono} {item.tipo_emergencia?.nombre || 'General'}
                </Text>
                <Text style={styles.actionPrompt}>Atender Misión →</Text>
              </View>
            </TouchableOpacity>
          )}
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
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardId: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.xs,
  },
  cardTipo: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionPrompt: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    color: Colors.primary,
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
  },
});
