import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import EstadoBadge from '../../../src/components/EstadoBadge';
import { api } from '../../../src/lib/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/constants/theme';
import { Emergencia, EstadoEmergencia } from '../../../src/types';

export default function DetalleMisionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [emergencia, setEmergencia] = useState<Emergencia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [resolucion, setResolucion] = useState('');
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);

  const cargarDetalle = async () => {
    try {
      const res = await api.get(`/emergencias/${id}`);
      if (res.data?.datos) {
        setEmergencia(res.data.datos);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDetalle();
  }, [id]);

  const handleIniciarAtencion = async () => {
    Alert.alert(
      'Confirmar Arribo',
      '¿Tu unidad ha llegado a la escena y da inicio a la atención médica/rescate?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Arribo',
          onPress: async () => {
            setProcesando(true);
            try {
              await api.patch(`/emergencias/${id}/iniciar-atencion`, {
                notas_atencion: 'Personal en campo reporta llegada y apertura de perímetro.',
              });
              await cargarDetalle();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.mensaje || 'No se pudo actualizar');
            } finally {
              setProcesando(false);
            }
          },
        },
      ]
    );
  };

  const handleCerrar = async () => {
    if (!resolucion.trim()) {
      Alert.alert('Campo requerido', 'Ingresa la resolución final de la atención');
      return;
    }

    setProcesando(true);
    try {
      await api.patch(`/emergencias/${id}/cerrar`, { resolucion });
      Alert.alert('Emergencia Cerrada', 'Misión completada. La unidad vuelve a estar DISPONIBLE.', [
        { text: 'Aceptar', onPress: () => router.replace('/(campo)/asignaciones') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.mensaje || 'No se pudo cerrar');
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!emergencia) {
    return (
      <View style={styles.center}>
        <Text>Emergencia no encontrada</Text>
      </View>
    );
  }

  const abrirMapa = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${emergencia.latitud},${emergencia.longitud}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.idText}>Caso #{emergencia.id}</Text>
          <Text style={styles.tipoText}>
            {emergencia.tipo_emergencia?.icono} {emergencia.tipo_emergencia?.nombre}
          </Text>
        </View>
        <EstadoBadge estado={emergencia.estado} />
      </View>

      {/* RNF-07: Información de Captura Inicial */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Descripción Inicial del Ciudadano (RNF-07)</Text>
        <Text style={styles.descText}>{emergencia.descripcion}</Text>

        <TouchableOpacity style={styles.mapButton} onPress={abrirMapa}>
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={styles.mapButtonText}>Navegar con GPS hasta la escena</Text>
        </TouchableOpacity>
      </View>

      {emergencia.notas_despacho && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Instrucciones de Despacho (RF-05)</Text>
          <Text style={styles.instruccionesText}>{emergencia.notas_despacho}</Text>
        </View>
      )}

      {/* Botones de Acción Operativa */}
      {emergencia.estado === EstadoEmergencia.ASIGNADO && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.warning }]}
          onPress={handleIniciarAtencion}
          disabled={procesando}
        >
          {procesando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Iniciar Atención en Escena</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {emergencia.estado === EstadoEmergencia.EN_ATENCION && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cierre de Atención Médica / Operativa</Text>
          <TextInput
            style={styles.textArea}
            value={resolucion}
            onChangeText={setResolucion}
            placeholder="Escribe el informe o resolución final..."
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.success, marginTop: Spacing.md }]}
            onPress={handleCerrar}
            disabled={procesando}
          >
            {procesando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Finalizar Misión y Liberar Unidad</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {emergencia.estado === EstadoEmergencia.CERRADO && (
        <View style={[styles.card, { backgroundColor: '#f0fdf4' }]}>
          <Text style={[styles.sectionTitle, { color: Colors.success }]}>Caso Cerrado</Text>
          <Text style={styles.descText}>{emergencia.resolucion}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  idText: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  tipoText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  descText: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  instruccionesText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '500',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: FontSize.sm,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.sm,
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
});
