import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EmergenciaCard from '../../src/components/EmergenciaCard';
import EstadoBadge from '../../src/components/EstadoBadge';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../src/constants/theme';
import { Emergencia, EstadoEmergencia } from '../../src/types';
import { useSocket } from '../../src/contexts/SocketContext';

export default function InicioScreen() {
  const router = useRouter();
  const { usuario, estaAutenticado, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarMisReportes = useCallback(async () => {
    if (!estaAutenticado) {
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      const res = await api.get('/emergencias/mis-reportes');
      const lista = res.data?.datos || res.data;
      if (Array.isArray(lista)) {
        setEmergencias(lista);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        // Redirigir limpiamente a login sin disparar logbox de error no manejado
        await logout();
        router.replace('/(auth)/login');
        return;
      }
      console.warn('Advertencia al consultar reportes:', err?.message || err);
    } finally {
      setCargando(false);
    }
  }, [estaAutenticado, logout, router]);

  useEffect(() => {
    if (estaAutenticado) {
      cargarMisReportes();
    }
  }, [estaAutenticado, cargarMisReportes]);

  // Actualización instantánea por WebSocket
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      cargarMisReportes();
    };
    socket.on('case:update', handleUpdate);
    socket.on('sos:alert', handleUpdate);
    return () => {
      socket.off('case:update', handleUpdate);
      socket.off('sos:alert', handleUpdate);
    };
  }, [socket, cargarMisReportes]);

  // Caso activo más reciente
  const casoActivo = useMemo(
    () => emergencias.find((e) => e.estado !== EstadoEmergencia.CERRADO),
    [emergencias]
  );

  // Métricas rápidas
  const activasCount = emergencias.filter(
    (e) => e.estado !== EstadoEmergencia.CERRADO
  ).length;
  const cerradasCount = emergencias.filter(
    (e) => e.estado === EstadoEmergencia.CERRADO
  ).length;

  // Pasos de progreso para el caso activo
  const getPasoActivo = (estado: EstadoEmergencia): number => {
    switch (estado) {
      case EstadoEmergencia.REPORTADO:
        return 1;
      case EstadoEmergencia.CLASIFICADO:
        return 2;
      case EstadoEmergencia.ASIGNADO:
        return 3;
      case EstadoEmergencia.EN_ATENCION:
        return 4;
      default:
        return 0;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Encabezado con saludo */}
        <View style={styles.header}>
          <View>
            <Text style={styles.saludo}>Hola, {usuario?.nombre || 'Ciudadano'}</Text>
            <Text style={styles.subtitulo}>Centro de monitoreo y tus reportes de auxilio</Text>
          </View>
          <TouchableOpacity
            style={styles.sosQuickBtn}
            onPress={() => router.push('/(ciudadano)/reportar')}
          >
            <Ionicons name="alert-circle" size={18} color="#fff" />
            <Text style={styles.sosQuickText}>SOS</Text>
          </TouchableOpacity>
        </View>

        {/* Banner de Caso Activo en Vivo si existe */}
        {casoActivo && (
          <View style={styles.activeCaseCard}>
            <View style={styles.activeCaseHeader}>
              <View style={styles.activeCaseBadgeRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.activeCaseTitle}>CASO #{casoActivo.id} EN ATENCIÓN EN VIVO</Text>
              </View>
              <EstadoBadge estado={casoActivo.estado} size="sm" />
            </View>

            <Text style={styles.activeCaseDesc} numberOfLines={2}>
              {casoActivo.descripcion}
            </Text>

            {/* Stepper de Seguimiento Operativo */}
            <View style={styles.stepperContainer}>
              {[
                { paso: 1, label: 'Reporte' },
                { paso: 2, label: 'Triage' },
                { paso: 3, label: 'Despacho' },
                { paso: 4, label: 'En Escena' },
              ].map((step, idx) => {
                const pasoActual = getPasoActivo(casoActivo.estado);
                const completado = pasoActual >= step.paso;
                const esActual = pasoActual === step.paso;

                return (
                  <View key={step.paso} style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepCircle,
                        completado && styles.stepCircleCompleted,
                        esActual && styles.stepCircleCurrent,
                      ]}
                    >
                      {completado && !esActual ? (
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      ) : (
                        <Text
                          style={[
                            styles.stepNumber,
                            (completado || esActual) && { color: '#fff' },
                          ]}
                        >
                          {step.paso}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        (completado || esActual) && styles.stepLabelActive,
                      ]}
                    >
                      {step.label}
                    </Text>
                    {idx < 3 && (
                      <View
                        style={[
                          styles.stepLine,
                          pasoActual > step.paso && styles.stepLineCompleted,
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Unidad Asignada si aplica */}
            {casoActivo.unidad && (
              <View style={styles.unitAssignedPill}>
                <Ionicons name="shield-checkmark" size={14} color="#7c3aed" />
                <Text style={styles.unitAssignedText}>
                  Recurso Asignado: {casoActivo.unidad.tipo} [{casoActivo.unidad.codigo}]
                </Text>
              </View>
            )}

            <View style={styles.activeCaseFooter}>
              <TouchableOpacity
                style={styles.callDispatchBtn}
                onPress={() => Linking.openURL('tel:123')}
              >
                <Ionicons name="call" size={14} color="#fff" />
                <Text style={styles.callDispatchText}>Llamar a Despacho 123</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tarjetas de métricas rápidas */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { borderLeftColor: Colors.warning }]}>
            <Text style={styles.metricNumber}>{activasCount}</Text>
            <Text style={styles.metricLabel}>Activos / En Curso</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: Colors.success }]}>
            <Text style={styles.metricNumber}>{cerradasCount}</Text>
            <Text style={styles.metricLabel}>Resueltos / Cerrados</Text>
          </View>
        </View>

        {/* Barra Rápida de Líneas Telefónicas */}
        <View style={styles.hotlinesBar}>
          <Text style={styles.hotlinesTitle}>LÍNEAS DIRECTAS:</Text>
          <TouchableOpacity
            style={styles.hotlinePill}
            onPress={() => Linking.openURL('tel:123')}
          >
            <Text style={styles.hotlinePillText}>📞 123 Central</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.hotlinePill}
            onPress={() => Linking.openURL('tel:125')}
          >
            <Text style={styles.hotlinePillText}>🚑 125 CRUE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.hotlinePill}
            onPress={() => Linking.openURL('tel:119')}
          >
            <Text style={styles.hotlinePillText}>🚒 119 Bomberos</Text>
          </TouchableOpacity>
        </View>

        {/* Listado o Estado Vacío */}
        {emergencias.length === 0 && !cargando ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="shield-checkmark" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Sin incidentes reportados</Text>
            <Text style={styles.emptySubtitle}>
              No tienes emergencias activas en curso. Si presencias un incidente que requiera auxilio,
              pulsa el botón de abajo.
            </Text>

            <TouchableOpacity
              style={styles.sosLargeButton}
              onPress={() => router.push('/(ciudadano)/reportar')}
            >
              <Ionicons name="megaphone" size={20} color="#fff" />
              <Text style={styles.sosLargeButtonText}>REPORTAR NUEVA EMERGENCIA</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={emergencias}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <EmergenciaCard emergencia={item} />}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={cargando}
                onRefresh={cargarMisReportes}
                colors={[Colors.primary]}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  saludo: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitulo: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sosQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
    ...Shadows.sm,
  },
  sosQuickText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: FontSize.xs,
  },
  activeCaseCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    ...Shadows.md,
  },
  activeCaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeCaseBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
  },
  activeCaseTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  activeCaseDesc: {
    fontSize: FontSize.xs,
    color: Colors.text,
    lineHeight: 18,
    fontWeight: '500',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: 8,
  },
  stepItem: {
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepCircleCompleted: {
    backgroundColor: '#16a34a',
  },
  stepCircleCurrent: {
    backgroundColor: '#2563eb',
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  stepNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 4,
  },
  stepLabelActive: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
  stepLine: {
    position: 'absolute',
    top: 12,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#e2e8f0',
    zIndex: 1,
  },
  stepLineCompleted: {
    backgroundColor: '#16a34a',
  },
  unitAssignedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  unitAssignedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b21a8',
  },
  activeCaseFooter: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  callDispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  callDispatchText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  metricNumber: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  metricLabel: {
    fontSize: FontSize.xs - 1,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  hotlinesBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    gap: 6,
    flexWrap: 'wrap',
  },
  hotlinesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  hotlinePill: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  hotlinePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1e40af',
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#eff6ff',
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
  sosLargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  sosLargeButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: FontSize.sm,
    letterSpacing: 0.5,
  },
});
