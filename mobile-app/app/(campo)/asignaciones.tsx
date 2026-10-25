import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EstadoBadge from '../../src/components/EstadoBadge';
import { api } from '../../src/lib/api';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../src/constants/theme';
import { Emergencia, EstadoEmergencia } from '../../src/types';
import { useSocket } from '../../src/contexts/SocketContext';

export default function AsignacionesScreen() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [asignaciones, setAsignaciones] = useState<Emergencia[]>([]);
  const [filtro, setFiltro] = useState<'TODAS' | 'ASIGNADO' | 'EN_ATENCION'>('TODAS');
  const [cargando, setCargando] = useState(true);

  const cargarAsignaciones = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get('/emergencias?limite=30');
      const lista = res.data?.datos?.emergencias || res.data?.emergencias || res.data?.datos || [];
      if (Array.isArray(lista)) {
        const activas = lista.filter(
          (e: Emergencia) =>
            e.estado === EstadoEmergencia.ASIGNADO || e.estado === EstadoEmergencia.EN_ATENCION
        );
        setAsignaciones(activas);
      }
    } catch (err) {
      console.error('Error al cargar asignaciones:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarAsignaciones();
  }, [cargarAsignaciones]);

  // Actualización automática por WebSocket en tiempo real
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      cargarAsignaciones();
    };
    socket.on('case:update', handleUpdate);
    socket.on('sos:alert', handleUpdate);
    return () => {
      socket.off('case:update', handleUpdate);
      socket.off('sos:alert', handleUpdate);
    };
  }, [socket, cargarAsignaciones]);

  const filtradas = asignaciones.filter((item) => {
    if (filtro === 'ASIGNADO') return item.estado === EstadoEmergencia.ASIGNADO;
    if (filtro === 'EN_ATENCION') return item.estado === EstadoEmergencia.EN_ATENCION;
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Banner Operativo */}
        <View style={styles.statusBanner}>
          <View style={styles.statusIndicator}>
            <View style={[styles.greenPulse, !isConnected && { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.statusTitle}>
              {isConnected ? 'UNIDAD EN LÍNEA • TIEMPO REAL' : 'SINCRONIZANDO CON CENTRAL...'}
            </Text>
          </View>
          <Text style={styles.statusSubtitle}>
            {asignaciones.length} {asignaciones.length === 1 ? 'misión activa' : 'misiones activas'}
          </Text>
        </View>

        {/* Filtros Rápidos */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filtro === 'TODAS' && styles.filterChipActive]}
            onPress={() => setFiltro('TODAS')}
          >
            <Text style={[styles.filterText, filtro === 'TODAS' && styles.filterTextActive]}>
              Todas ({asignaciones.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filtro === 'ASIGNADO' && styles.filterChipActive]}
            onPress={() => setFiltro('ASIGNADO')}
          >
            <Text style={[styles.filterText, filtro === 'ASIGNADO' && styles.filterTextActive]}>
              En Ruta
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filtro === 'EN_ATENCION' && styles.filterChipActive]}
            onPress={() => setFiltro('EN_ATENCION')}
          >
            <Text style={[styles.filterText, filtro === 'EN_ATENCION' && styles.filterTextActive]}>
              En Escena
            </Text>
          </TouchableOpacity>
        </View>

        {/* Listado de Misiones */}
        {filtradas.length === 0 && !cargando ? (
          <View style={styles.empty}>
            <View style={styles.emptyCircle}>
              <Ionicons name="checkmark-done-circle" size={48} color={Colors.success} />
            </View>
            <Text style={styles.emptyTitle}>Sin misiones activas</Text>
            <Text style={styles.emptySubtitle}>
              Tu unidad se encuentra disponible. Cuando el Centro de Despacho asigne una emergencia,
              aparecerá aquí inmediatamente.
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={cargarAsignaciones}>
              <Ionicons name="refresh" size={18} color={Colors.primary} />
              <Text style={styles.refreshButtonText}>Verificar Nuevos Despachos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filtradas}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl
                refreshing={cargando}
                onRefresh={cargarAsignaciones}
                colors={[Colors.primary]}
              />
            }
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => router.push(`/(campo)/detalle/${item.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.idPill}>
                      <Text style={styles.cardId}>Caso #{item.id}</Text>
                    </View>
                    <Text style={styles.cardTipo}>
                      {item.tipo_emergencia?.icono || '🚨'} {item.tipo_emergencia?.nombre || 'General'}
                    </Text>
                  </View>
                  <EstadoBadge estado={item.estado} size="sm" />
                </View>

                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.descripcion}
                </Text>

                {item.notas_despacho && (
                  <View style={styles.notasDespachoBox}>
                    <Ionicons name="information-circle" size={14} color={Colors.primary} />
                    <Text style={styles.notasDespachoText} numberOfLines={1}>
                      Despacho: {item.notas_despacho}
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <View style={styles.locationPill}>
                    <Ionicons name="location" size={14} color={Colors.textSecondary} />
                    <Text style={styles.coordsText}>
                      {Number(item.latitud).toFixed(3)}, {Number(item.longitud).toFixed(3)}
                    </Text>
                  </View>
                  <View style={styles.actionBtnRow}>
                    <Text style={styles.actionPrompt}>Atender Misión</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statusBanner: {
    backgroundColor: '#0f172a',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greenPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  statusTitle: {
    color: '#ffffff',
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusSubtitle: {
    color: '#94a3b8',
    fontSize: FontSize.xs,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: Spacing.xs + 2,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  idPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  cardId: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.text,
  },
  cardTipo: {
    fontSize: FontSize.xs + 1,
    fontWeight: '700',
    color: Colors.text,
  },
  cardDesc: {
    fontSize: FontSize.sm,
    color: '#334155',
    lineHeight: 19,
    marginBottom: Spacing.sm,
  },
  notasDespachoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  notasDespachoText: {
    fontSize: FontSize.xs - 1,
    color: Colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: Spacing.xs + 2,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coordsText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
  },
  refreshButtonText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
});
