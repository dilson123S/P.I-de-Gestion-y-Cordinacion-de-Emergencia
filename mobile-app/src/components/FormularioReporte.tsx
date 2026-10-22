/**
 * Componente FormularioReporte - Formulario reutilizable para crear reportes.
 * Gestiona la captura de datos de una emergencia incluyendo
 * descripción, ubicación automática y evidencia fotográfica.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocation } from '../hooks/useLocation';
import { formatearCoordenadas } from '../lib/location';
import { Colors, FontSize, Spacing, BorderRadius, Shadows } from '../constants/theme';
import type { CrearEmergenciaData } from '../types';

interface FormularioReporteProps {
  /** Callback al enviar el formulario con los datos completos */
  onSubmit: (data: CrearEmergenciaData) => Promise<void>;
  /** Indica si el formulario se está enviando */
  enviando?: boolean;
}

/**
 * Formulario completo para reportar una nueva emergencia.
 * Incluye campo de descripción, captura automática de ubicación,
 * selector de imágenes y botón de envío prominente.
 */
export default function FormularioReporte({ onSubmit, enviando = false }: FormularioReporteProps) {
  const [descripcion, setDescripcion] = useState('');
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const { ubicacion, cargando: cargandoUbicacion, error: errorUbicacion, refrescar } = useLocation(true);

  /**
   * Abre el selector de imágenes para adjuntar evidencia.
   * Permite seleccionar desde la galería o capturar con la cámara.
   */
  const seleccionarImagen = async () => {
    Alert.alert(
      'Adjuntar evidencia',
      'Selecciona el origen de la imagen',
      [
        {
          text: 'Cámara',
          onPress: async () => {
            const permisos = await ImagePicker.requestCameraPermissionsAsync();
            if (!permisos.granted) {
              Alert.alert('Permisos requeridos', 'Se necesitan permisos de cámara para tomar fotos.');
              return;
            }
            const resultado = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsEditing: true,
            });
            if (!resultado.canceled && resultado.assets[0]) {
              setImagenUri(resultado.assets[0].uri);
            }
          },
        },
        {
          text: 'Galería',
          onPress: async () => {
            const permisos = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permisos.granted) {
              Alert.alert('Permisos requeridos', 'Se necesitan permisos para acceder a la galería.');
              return;
            }
            const resultado = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsEditing: true,
            });
            if (!resultado.canceled && resultado.assets[0]) {
              setImagenUri(resultado.assets[0].uri);
            }
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  /** Elimina la imagen adjunta */
  const eliminarImagen = () => {
    setImagenUri(null);
  };

  /**
   * Valida y envía el formulario.
   * Requiere descripción y ubicación como mínimo.
   */
  const handleSubmit = async () => {
    if (!descripcion.trim()) {
      Alert.alert('Campo requerido', 'Por favor, describe la emergencia.');
      return;
    }

    if (!ubicacion) {
      Alert.alert(
        'Ubicación requerida',
        'No se pudo obtener tu ubicación. ¿Deseas intentar de nuevo?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reintentar', onPress: refrescar },
        ]
      );
      return;
    }

    const data: CrearEmergenciaData = {
      descripcion: descripcion.trim(),
      latitud: ubicacion.latitud,
      longitud: ubicacion.longitud,
    };

    if (imagenUri) {
      data.evidencia_url = imagenUri;
    }

    await onSubmit(data);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Campo de descripción */}
      <View style={styles.seccion}>
        <Text style={styles.label}>Descripción de la emergencia *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe qué está sucediendo, qué tipo de emergencia es y cualquier detalle relevante..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={descripcion}
          onChangeText={setDescripcion}
          maxLength={500}
          editable={!enviando}
        />
        <Text style={styles.contador}>{descripcion.length}/500</Text>
      </View>

      {/* Sección de ubicación */}
      <View style={styles.seccion}>
        <Text style={styles.label}>Ubicación</Text>
        <View style={styles.ubicacionCard}>
          {cargandoUbicacion ? (
            <View style={styles.ubicacionCargando}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.ubicacionTexto}>Obteniendo ubicación...</Text>
            </View>
          ) : ubicacion ? (
            <View style={styles.ubicacionInfo}>
              <Ionicons name="location" size={20} color={Colors.success} />
              <View style={styles.ubicacionDatos}>
                <Text style={styles.ubicacionTexto}>Ubicación capturada</Text>
                <Text style={styles.coordenadas}>
                  {formatearCoordenadas(ubicacion.latitud, ubicacion.longitud)}
                </Text>
              </View>
              <TouchableOpacity onPress={refrescar} style={styles.refrescarBtn}>
                <Ionicons name="refresh" size={18} color={Colors.primaryLight} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.ubicacionError}>
              <Ionicons name="warning" size={20} color={Colors.danger} />
              <Text style={styles.errorTexto}>
                {errorUbicacion || 'No se pudo obtener la ubicación'}
              </Text>
              <TouchableOpacity onPress={refrescar} style={styles.refrescarBtn}>
                <Text style={styles.reintentar}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Sección de evidencia */}
      <View style={styles.seccion}>
        <Text style={styles.label}>Evidencia fotográfica (opcional)</Text>
        {imagenUri ? (
          <View style={styles.imagenPreview}>
            <Image source={{ uri: imagenUri }} style={styles.imagen} />
            <TouchableOpacity
              style={styles.eliminarImagen}
              onPress={eliminarImagen}
              disabled={enviando}
            >
              <Ionicons name="close-circle" size={28} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.adjuntarBtn}
            onPress={seleccionarImagen}
            disabled={enviando}
          >
            <Ionicons name="camera-outline" size={32} color={Colors.primaryLight} />
            <Text style={styles.adjuntarTexto}>Tomar foto o seleccionar de galería</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Botón de envío */}
      <TouchableOpacity
        style={[styles.submitBtn, enviando && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={enviando}
        activeOpacity={0.8}
      >
        {enviando ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Ionicons name="alert-circle" size={22} color="#ffffff" />
            <Text style={styles.submitTexto}>REPORTAR EMERGENCIA</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Espacio inferior */}
      <View style={{ height: Spacing.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  seccion: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  textArea: {
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 120,
  },
  contador: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  ubicacionCard: {
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  ubicacionCargando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ubicacionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ubicacionDatos: {
    flex: 1,
  },
  ubicacionTexto: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  coordenadas: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ubicacionError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorTexto: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.danger,
  },
  refrescarBtn: {
    padding: Spacing.xs,
  },
  reintentar: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  adjuntarBtn: {
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  adjuntarTexto: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  imagenPreview: {
    position: 'relative',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  imagen: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
  },
  eliminarImagen: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: BorderRadius.full,
  },
  submitBtn: {
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.lg,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitTexto: {
    color: '#ffffff',
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
