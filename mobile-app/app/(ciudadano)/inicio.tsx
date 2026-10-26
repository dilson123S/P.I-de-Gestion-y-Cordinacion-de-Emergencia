import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EmergenciaCard from '../../src/components/EmergenciaCard';
import { api } from '../../src/lib/api';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../src/constants/theme';
import { Emergencia, EstadoEmergencia } from '../../src/types';
import { useSocket } from '../../src/contexts/SocketContext';

export default function InicioScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { socket, isConnected } = useSocket();
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [subiendoEvidencia, setSubiendoEvidencia] = useState<string | null>(null);

  const cargarMisReportes = useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get('/emergencias/mis-reportes');
      const lista = res.data?.datos || res.data;
      if (Array.isArray(lista)) {
        setEmergencias(lista);
      }
    } catch (err) {
      console.error('Error al cargar mis reportes:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  const elegirYSubirEvidencia = useCallback(async (emergencia: Emergencia, origen: 'camera' | 'gallery') => {
    try {
      const permiso = origen === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso requerido', 'Autoriza el acceso a la cámara o a tus fotos para adjuntar la evidencia.');
        return;
      }

      const resultado = origen === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true });
      const foto = resultado.canceled ? null : resultado.assets[0];
      if (!foto) return;

      setSubiendoEvidencia(String(emergencia.id));
      const nombre = foto.fileName || foto.uri.split('/').pop()?.split('?')[0] || 'evidencia.jpg';
      const mime = foto.mimeType || (/\.png$/i.test(nombre) ? 'image/png' : 'image/jpeg');
      const formData = new FormData();
      formData.append('archivo', { uri: foto.uri, name: nombre, type: mime } as any);
      const respuesta = await api.post(`/emergencias/${emergencia.id}/evidencia`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const evidenciaUrl = respuesta.data?.datos?.evidencia_url;
      if (!evidenciaUrl) throw new Error('El servidor no confirmó que la foto quedó adjunta.');

      setEmergencias((actuales) => actuales.map((item) =>
        String(item.id) === String(emergencia.id) ? { ...item, evidencia_url: evidenciaUrl } : item
      ));
      Alert.alert('Foto adjunta', 'El operador ya puede abrir la evidencia desde el panel web.');
    } catch (error: any) {
      Alert.alert('No se pudo adjuntar la foto', error?.response?.data?.mensaje || error.message || 'Intenta nuevamente.');
    } finally {
      setSubiendoEvidencia(null);
    }
  }, []);

  const adjuntarEvidencia = (emergencia: Emergencia) => {
    Alert.alert('Adjuntar evidencia', 'Elige cómo agregar la foto a este reporte.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tomar foto', onPress: () => elegirYSubirEvidencia(emergencia, 'camera') },
      { text: 'Elegir de galería', onPress: () => elegirYSubirEvidencia(emergencia, 'gallery') },
    ]);
  };

  useEffect(() => {
    cargarMisReportes();
  }, [cargarMisReportes]);

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

  // Métricas rápidas
  const activasCount = emergencias.filter(
    (e) => e.estado !== EstadoEmergencia.CERRADO
  ).length;
  const cerradasCount = emergencias.filter(
    (e) => e.estado === EstadoEmergencia.CERRADO
  ).length;

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
            renderItem={({ item }) => (
              <View>
                <EmergenciaCard emergencia={item} />
                {(!item.evidencia_url || /^(file|content):/i.test(item.evidencia_url)) && (
                  <TouchableOpacity
                    style={styles.attachEvidenceButton}
                    onPress={() => adjuntarEvidencia(item)}
                    disabled={subiendoEvidencia !== null}
                  >
                    {subiendoEvidencia === String(item.id) ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Ionicons name="camera-outline" size={16} color={Colors.primary} />
                    )}
                    <Text style={styles.attachEvidenceText}>
                      {subiendoEvidencia === String(item.id) ? 'Subiendo foto…' : 'Adjuntar o reemplazar foto'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
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
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  attachEvidenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  attachEvidenceText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '700',
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
