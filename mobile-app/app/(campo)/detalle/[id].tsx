/**
 * Pantalla DetalleMisionScreen - Centro de acción táctica para personal en campo.
 * Implementa el principio RNF-07 (la información del ciudadano fluye automáticamente),
 * navegación GPS, confirmación de arribo y cierre de misión.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Linking,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EstadoBadge from '../../../src/components/EstadoBadge';
import { api } from '../../../src/lib/api';
import { obtenerUrlCompleta } from '../../../src/lib/apiConfig';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../../src/constants/theme';
import { Emergencia, EstadoEmergencia } from '../../../src/types';

const RESOLUCIONES_RAPIDAS = [
  'Situación controlada en el sitio sin heridos de gravedad.',
  'Paciente estabilizado y trasladado a centro asistencial.',
  'Incendio sofocado por completo; área asegurada.',
  'Falsa alarma confirmada tras inspección en la escena.',
];

export default function DetalleMisionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [emergencia, setEmergencia] = useState<Emergencia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [resolucion, setResolucion] = useState('');

  const cargarDetalle = useCallback(async () => {
    try {
      const res = await api.get(`/emergencias/${id}`);
      const data = res.data?.datos || res.data;
      if (data) {
        setEmergencia(data);
        if (data.resolucion) {
          setResolucion(data.resolucion);
        }
      }
    } catch (err) {
      console.error('Error al cargar detalle:', err);
      Alert.alert('Error', 'No se pudo cargar la información de la misión.');
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  /** Inicia la atención en escena */
  const handleIniciarAtencion = async () => {
    Alert.alert(
      'Confirmar Arribo a la Escena',
      '¿Tu unidad ha llegado a las coordenadas y da inicio a la atención médica o rescate?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Llegada',
          onPress: async () => {
            setProcesando(true);
            try {
              await api.patch(`/emergencias/${id}/iniciar-atencion`, {
                notas_atencion: 'Unidad arribó a la escena. Se establece perímetro y se asiste a los afectados.',
              });
              await cargarDetalle();
              Alert.alert('Estado Actualizado', 'La misión pasó a estado EN ATENCIÓN.');
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.mensaje || 'No se pudo actualizar el estado');
            } finally {
              setProcesando(false);
            }
          },
        },
      ]
    );
  };

  /** Cierre formal de la misión */
  const handleCerrar = async () => {
    if (!resolucion.trim() || resolucion.trim().length < 10) {
      Alert.alert('Informe requerido', 'Por favor ingresa la resolución final del caso (mínimo 10 caracteres).');
      return;
    }

    setProcesando(true);
    try {
      await api.patch(`/emergencias/${id}/cerrar`, { resolucion: resolucion.trim() });
      Alert.alert('Misión Finalizada', 'Reporte guardado con éxito. Tu unidad vuelve a estar DISPONIBLE.', [
        { text: 'Aceptar', onPress: () => router.replace('/(campo)/asignaciones') },
      ]);
    } catch (err: any) {
      Alert.alert('Error al cerrar', err?.response?.data?.mensaje || 'No se pudo completar el cierre');
    } finally {
      setProcesando(false);
    }
  };

  const abrirNavegacion = () => {
    if (!emergencia) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${emergencia.latitud},${emergencia.longitud}`;
    Linking.openURL(url);
  };

  const llamarCiudadano = () => {
    const telefono = emergencia?.ciudadano?.telefono;
    if (telefono) {
      Linking.openURL(`tel:${telefono}`);
    } else {
      Alert.alert('Sin teléfono', 'El ciudadano reportante no registró un número telefónico.');
    }
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando datos de la misión...</Text>
      </View>
    );
  }

  if (!emergencia) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
        <Text style={styles.notFoundText}>Emergencia no encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Cabecera Táctica */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.idLabel}>MISIÓN DE DESPACHO</Text>
            <Text style={styles.idValue}>Caso #{emergencia.id}</Text>
          </View>
          <EstadoBadge estado={emergencia.estado} size="md" />
        </View>

        <Text style={styles.tipoText}>
          {emergencia.tipo_emergencia?.icono || '🚨'} {emergencia.tipo_emergencia?.nombre || 'Emergencia'}
        </Text>

        {/* Botón de Navegación GPS Rápida */}
        <TouchableOpacity style={styles.navButton} onPress={abrirNavegacion}>
          <Ionicons name="navigate" size={20} color="#fff" />
          <Text style={styles.navButtonText}>INICIAR NAVEGACIÓN GPS (MAPS / WAZE)</Text>
        </TouchableOpacity>
      </View>

      {/* RNF-07: Información de Captura Inicial */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Descripción Inicial del Ciudadano (RNF-07)</Text>
        </View>
        <Text style={styles.descText}>{emergencia.descripcion}</Text>

        {emergencia.evidencia_url && (
          <View style={styles.evidenceContainer}>
            <Text style={styles.evidenceLabel}>Evidencia multimedia adjunta:</Text>
            <Image
              source={{ uri: obtenerUrlCompleta(emergencia.evidencia_url) || emergencia.evidencia_url }}
              style={styles.evidenceImage}
              resizeMode="cover"
            />
          </View>
        )}
      </View>

      {/* Datos del Ciudadano y Contacto Directo */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="person-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Ciudadano Reportante</Text>
        </View>
        <View style={styles.citizenRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.citizenName}>
              {emergencia.ciudadano
                ? `${emergencia.ciudadano.nombre} ${emergencia.ciudadano.apellido}`
                : 'Ciudadano'}
            </Text>
            <Text style={styles.citizenPhone}>
              {emergencia.ciudadano?.telefono || 'Teléfono no suministrado'}
            </Text>
          </View>
          {emergencia.ciudadano?.telefono && (
            <TouchableOpacity style={styles.callButton} onPress={llamarCiudadano}>
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.callButtonText}>Llamar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Instrucciones de Despacho (RF-05) */}
      {emergencia.notas_despacho && (
        <View style={[styles.card, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="megaphone-outline" size={18} color={Colors.primary} />
            <Text style={[styles.sectionTitle, { color: Colors.primary }]}>
              Instrucciones de Despacho (RF-05)
            </Text>
          </View>
          <Text style={styles.despachoText}>{emergencia.notas_despacho}</Text>
        </View>
      )}

      {/* Acciones Operativas según Estado */}
      {emergencia.estado === EstadoEmergencia.ASIGNADO && (
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Acción de Campo Requerida</Text>
          <Text style={styles.actionSubtitle}>
            Cuando tu unidad llegue físicamente al lugar de los hechos, confirma la llegada para registrar
            el tiempo de respuesta y pasar a atención.
          </Text>
          <TouchableOpacity
            style={styles.arriveBtn}
            onPress={handleIniciarAtencion}
            disabled={procesando}
          >
            {procesando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="play" size={22} color="#fff" />
                <Text style={styles.arriveBtnText}>CONFIRMAR LLEGADA A LA ESCENA</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {emergencia.estado === EstadoEmergencia.EN_ATENCION && (
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Cierre y Resolución de la Misión</Text>
          <Text style={styles.actionSubtitle}>
            Selecciona una resolución predefinida o describe las acciones realizadas para liberar la unidad.
          </Text>

          {/* Opciones rápidas */}
          <View style={styles.quickOptions}>
            {RESOLUCIONES_RAPIDAS.map((resTexto, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickChip}
                onPress={() => setResolucion(resTexto)}
              >
                <Text style={styles.quickChipText} numberOfLines={1}>
                  + {resTexto}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.textArea}
            value={resolucion}
            onChangeText={setResolucion}
            placeholder="Escribe el informe o resolución final..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleCerrar}
            disabled={procesando}
          >
            {procesando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={22} color="#fff" />
                <Text style={styles.closeBtnText}>FINALIZAR MISIÓN Y LIBERAR UNIDAD</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {emergencia.estado === EstadoEmergencia.CERRADO && (
        <View style={[styles.card, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={[styles.sectionTitle, { color: Colors.success }]}>Caso Cerrado y Reportado</Text>
          </View>
          <Text style={styles.descText}>{emergencia.resolucion}</Text>
        </View>
      )}

      <View style={{ height: Spacing.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: Spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  notFoundText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerCard: {
    backgroundColor: '#0f172a',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  idLabel: {
    fontSize: FontSize.xs - 2,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 1,
  },
  idValue: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: '#ffffff',
  },
  tipoText: {
    fontSize: FontSize.md,
    color: '#38bdf8',
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  navButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: FontSize.xs + 1,
    letterSpacing: 0.5,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs + 2,
  },
  sectionTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descText: {
    fontSize: FontSize.sm + 1,
    color: Colors.text,
    lineHeight: 22,
  },
  evidenceContainer: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: Spacing.sm,
  },
  evidenceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  evidenceImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
  },
  citizenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  citizenName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  citizenPhone: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  callButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: FontSize.xs,
  },
  despachoText: {
    fontSize: FontSize.sm,
    color: '#1e3a8a',
    fontWeight: '600',
    lineHeight: 20,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    ...Shadows.md,
  },
  actionTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  arriveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ea580c',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  arriveBtnText: {
    color: '#ffffff',
    fontSize: FontSize.sm + 1,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quickOptions: {
    gap: 6,
    marginBottom: Spacing.sm,
  },
  quickChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  quickChipText: {
    fontSize: FontSize.xs - 1,
    color: Colors.text,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.sm,
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: Spacing.md,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: FontSize.sm + 1,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
