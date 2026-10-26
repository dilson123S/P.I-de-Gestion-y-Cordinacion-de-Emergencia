import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EstadoBadge from '../../src/components/EstadoBadge';
import { api } from '../../src/lib/api';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../src/constants/theme';
import { Emergencia, EstadoEmergencia } from '../../src/types';
import { useSocket } from '../../src/contexts/SocketContext';
import { useAuth } from '../../src/hooks/useAuth';

export default function AsignacionesScreen() {
  const router = useRouter();
  const { usuario, estaAutenticado, logout, refrescarPerfil } = useAuth();
  const { socket, isConnected } = useSocket();
  const [asignaciones, setAsignaciones] = useState<Emergencia[]>([]);
  const [filtro, setFiltro] = useState<'MI_UNIDAD' | 'TODAS' | 'EN_RUTA' | 'EN_ESCENA'>('MI_UNIDAD');
  const [cargando, setCargando] = useState(true);
  const misionesVistasRef = useRef<Set<string | number>>(new Set());

  const unidadId = usuario?.unidad_asignada?.id ? Number(usuario.unidad_asignada.id) : null;
  const miPersonalId = usuario?.id ? Number(usuario.id) : null;

  const esDeMiUnidad = useCallback(
    (e: Emergencia) => {
      if (unidadId && Number(e.id_unidad) === unidadId) return true;
      if (miPersonalId && Number(e.unidad?.id_personal) === miPersonalId) return true;
      return false;
    },
    [unidadId, miPersonalId]
  );

  const cargarAsignaciones = useCallback(
    async (mostrarSpinner = true) => {
      if (!estaAutenticado) {
        setCargando(false);
        return;
      }
      if (mostrarSpinner) setCargando(true);

      try {
        const res = await api.get('/emergencias?limite=40');
        const lista = res.data?.datos?.emergencias || res.data?.emergencias || res.data?.datos || [];

        if (Array.isArray(lista)) {
          const activas = lista.filter(
            (e: Emergencia) =>
              e.estado === EstadoEmergencia.ASIGNADO || e.estado === EstadoEmergencia.EN_ATENCION
          );

          // Detectar si ha llegado una nueva misión para mi unidad y notificar
          activas.forEach((m: Emergencia) => {
            if (esDeMiUnidad(m) && !misionesVistasRef.current.has(m.id)) {
              misionesVistasRef.current.add(m.id);
              Vibration.vibrate([0, 500, 200, 500]);
            }
          });

          setAsignaciones(activas);
        }
      } catch (err: any) {
        if (err?.response?.status === 401) {
          await logout();
          router.replace('/(auth)/login');
          return;
        }
        console.warn('Advertencia al consultar asignaciones:', err?.message || err);
      } finally {
        if (mostrarSpinner) setCargando(false);
      }
    },
    [estaAutenticado, logout, router, esDeMiUnidad]
  );

  // Carga inicial y sondeo periódico automático en segundo plano (cada 4s)
  useEffect(() => {
    if (!estaAutenticado) return;
    cargarAsignaciones(true);
    refrescarPerfil();

    const interval = setInterval(() => {
      cargarAsignaciones(false);
      refrescarPerfil();
    }, 4000);

    return () => clearInterval(interval);
  }, [estaAutenticado, cargarAsignaciones, refrescarPerfil]);

  // Actualización instantánea por WebSocket si está conectado
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      cargarAsignaciones(false);
    };
    socket.on('case:update', handleUpdate);
    socket.on('sos:alert', handleUpdate);
    return () => {
      socket.off('case:update', handleUpdate);
      socket.off('sos:alert', handleUpdate);
    };
  }, [socket, cargarAsignaciones]);

  const misMisiones = asignaciones.filter(esDeMiUnidad);

  // Filtrado según pestaña
  const filtradas = asignaciones.filter((item) => {
    if (filtro === 'MI_UNIDAD') return esDeMiUnidad(item);
    if (filtro === 'EN_RUTA') return item.estado === EstadoEmergencia.ASIGNADO;
    if (filtro === 'EN_ESCENA') return item.estado === EstadoEmergencia.EN_ATENCION;
    return true; // 'TODAS'
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Banner Operativo Institucional */}
        <View style={styles.statusBanner}>
          <View style={styles.statusIndicator}>
            <View style={[styles.greenPulse, !isConnected && { backgroundColor: '#22c55e' }]} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>
                {usuario?.unidad_asignada
                  ? `UNIDAD [${usuario.unidad_asignada.codigo}] • ${usuario.unidad_asignada.tipo.split('-')[0].trim()}`
                  : 'PERSONAL DE CAMPO • GUARDIA ACTIVA'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {misMisiones.length} {misMisiones.length === 1 ? 'misión directa asignada' : 'misiones directas asignadas'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.refreshBadge}
            onPress={() => {
              cargarAsignaciones(true);
              refrescarPerfil();
            }}
          >
            <Ionicons name="sync" size={14} color="#60a5fa" />
            <Text style={styles.refreshBadgeText}>Sincronizar</Text>
          </TouchableOpacity>
        </View>

        {/* Pestañas de Filtrado */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filtro === 'MI_UNIDAD' && styles.filterChipActive]}
            onPress={() => setFiltro('MI_UNIDAD')}
          >
            <Text style={[styles.filterText, filtro === 'MI_UNIDAD' && styles.filterTextActive]}>
              Mi Unidad ({misMisiones.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filtro === 'TODAS' && styles.filterChipActive]}
            onPress={() => setFiltro('TODAS')}
          >
            <Text style={[styles.filterText, filtro === 'TODAS' && styles.filterTextActive]}>
              Todas ({asignaciones.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filtro === 'EN_RUTA' && styles.filterChipActive]}
            onPress={() => setFiltro('EN_RUTA')}
          >
            <Text style={[styles.filterText, filtro === 'EN_RUTA' && styles.filterTextActive]}>
              En Ruta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filtro === 'EN_ESCENA' && styles.filterChipActive]}
            onPress={() => setFiltro('EN_ESCENA')}
          >
            <Text style={[styles.filterText, filtro === 'EN_ESCENA' && styles.filterTextActive]}>
              En Escena
            </Text>
          </TouchableOpacity>
        </View>

        {/* Listado de Misiones */}
        {filtradas.length === 0 && !cargando ? (
          <View style={styles.empty}>
            <View style={styles.emptyCircle}>
              <Ionicons name="shield-checkmark" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {filtro === 'MI_UNIDAD'
                ? `Unidad [${usuario?.unidad_asignada?.codigo || 'PL-01'}] Disponible`
                : 'Sin misiones en este estado'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filtro === 'MI_UNIDAD'
                ? `No tienes despachos asignados a tu móvil en este momento. La Central CAD 123 (Operador Integral) te asignará misiones prioritarias según tu ubicación.`
                : 'No se encontraron emergencias activas para este filtro.'}
            </Text>

            {filtro === 'MI_UNIDAD' && asignaciones.length > 0 && (
              <TouchableOpacity style={styles.switchButton} onPress={() => setFiltro('TODAS')}>
                <Ionicons name="list" size={16} color="#ffffff" />
                <Text style={styles.switchButtonText}>
                  Ver Todas las Misiones de la Red ({asignaciones.length})
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                cargarAsignaciones(true);
                refrescarPerfil();
              }}
            >
              <Ionicons name="refresh" size={18} color={Colors.primary} />
              <Text style={styles.refreshButtonText}>Verificar con Central CAD</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filtradas}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl
                refreshing={cargando}
                onRefresh={() => {
                  cargarAsignaciones(true);
                  refrescarPerfil();
                }}
                colors={[Colors.primary]}
              />
            }
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const paraMi = esDeMiUnidad(item);

              return (
                <TouchableOpacity
                  style={[styles.card, paraMi && styles.cardMyUnit]}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/(campo)/detalle/${item.id}`)}
                >
                  {/* Banner de Unidad Asignada */}
                  <View style={styles.cardTopBadgeRow}>
                    {paraMi ? (
                      <View style={styles.myUnitBanner}>
                        <Ionicons name="shield-checkmark" size={13} color="#1e40af" />
                        <Text style={styles.myUnitBannerText}>
                          DESPACHO DIRECTO A TU UNIDAD [{usuario?.unidad_asignada?.codigo || 'PL-01'}]
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.otherUnitBanner}>
                        <Ionicons name="car-sport" size={12} color="#64748b" />
                        <Text style={styles.otherUnitBannerText}>
                          Unidad: [{item.unidad?.codigo || 'En Asignación'}]
                        </Text>
                      </View>
                    )}

                    <EstadoBadge estado={item.estado} size="sm" />
                  </View>

                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.idPill}>
                        <Text style={styles.cardId}>Caso #{item.id}</Text>
                      </View>
                      <Text style={styles.cardTipo}>
                        {item.tipo_emergencia?.icono || '🚨'} {item.tipo_emergencia?.nombre || 'General'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.descripcion}
                  </Text>

                  {item.notas_despacho && (
                    <View style={styles.notasDespachoBox}>
                      <Ionicons name="information-circle" size={14} color={Colors.primary} />
                      <Text style={styles.notasDespachoText} numberOfLines={2}>
                        Orden CAD: {item.notas_despacho}
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
                      <Text style={[styles.actionPrompt, paraMi && styles.actionPromptHighlight]}>
                        Atender Misión
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color={paraMi ? Colors.primary : Colors.textSecondary}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
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
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusTextContainer: {
    flex: 1,
  },
  greenPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  statusTitle: {
    color: '#ffffff',
    fontSize: FontSize.xs + 1,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  statusSubtitle: {
    color: '#94a3b8',
    fontSize: FontSize.xs - 1,
    marginTop: 1,
  },
  refreshBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#334155',
  },
  refreshBadgeText: {
    color: '#93c5fd',
    fontSize: FontSize.xs - 2,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.sm + 2,
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
  cardMyUnit: {
    borderColor: '#3b82f6',
    borderWidth: 2,
    backgroundColor: '#f8faff',
    ...Shadows.md,
  },
  cardTopBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  myUnitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  myUnitBannerText: {
    fontSize: FontSize.xs - 2,
    fontWeight: '800',
    color: '#1e40af',
    fontFamily: 'monospace',
  },
  otherUnitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  otherUnitBannerText: {
    fontSize: FontSize.xs - 2,
    color: '#64748b',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
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
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  notasDespachoText: {
    fontSize: FontSize.xs - 1,
    color: '#1e40af',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
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
    color: Colors.textSecondary,
  },
  actionPromptHighlight: {
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
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSize.xs + 1,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
    maxWidth: 320,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  switchButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: FontSize.xs + 1,
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
    fontSize: FontSize.xs + 1,
  },
});
