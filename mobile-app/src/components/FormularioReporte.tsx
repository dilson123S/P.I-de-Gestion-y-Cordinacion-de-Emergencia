/**
 * Componente FormularioReporte - Formulario de alta urgencia para reportes SOS.
 * Diseñado con accesibilidad, selector de categorías rápidas,
 * confirmación de GPS con precisión y captura multimedia de evidencia.
 */

import React, { useState } from 'react';
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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocation } from '../hooks/useLocation';
import { formatearCoordenadas } from '../lib/location';
import { Colors, FontSize, Spacing, BorderRadius, Shadows } from '../constants/theme';
import type { CrearEmergenciaData } from '../types';
import { api } from '../lib/api';

interface FormularioReporteProps {
  /** Callback al enviar el formulario con los datos completos */
  onSubmit: (data: CrearEmergenciaData) => Promise<void>;
  /** Indica si el formulario se está enviando */
  enviando?: boolean;
}

/** Categorías rápidas para facilitar el triage inicial */
const CATEGORIAS_RAPIDAS = [
  { id: 'MEDICA', label: 'Médica', icon: 'medical' },
  { id: 'INCENDIO', label: 'Incendio', icon: 'flame' },
  { id: 'TRANSITO', label: 'Accidente Vial', icon: 'car-sport' },
  { id: 'SEGURIDAD', label: 'Seguridad', icon: 'shield-alert' },
  { id: 'RESCATE', label: 'Rescate', icon: 'help-buoy' },
  { id: 'OTRO', label: 'Otro Incidente', icon: 'alert-circle' },
];

export default function FormularioReporte({ onSubmit, enviando = false }: FormularioReporteProps) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('MEDICA');
  const [descripcion, setDescripcion] = useState('');
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const { ubicacion, cargando: cargandoUbicacion, error: errorUbicacion, refrescar } = useLocation(true);

  /** Abre la cámara o galería según opción seleccionada */
  const tomarFoto = async () => {
    try {
      const permisos = await ImagePicker.requestCameraPermissionsAsync();
      if (!permisos.granted) {
        Alert.alert('Permisos requeridos', 'Se necesitan permisos de cámara para capturar la evidencia.');
        return;
      }
      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });
      if (!resultado.canceled && resultado.assets[0]) {
        setImagenUri(resultado.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir la cámara');
    }
  };

  const seleccionarGaleria = async () => {
    try {
      const permisos = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permisos.granted) {
        Alert.alert('Permisos requeridos', 'Se necesitan permisos para acceder a las fotos.');
        return;
      }
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });
      if (!resultado.canceled && resultado.assets[0]) {
        setImagenUri(resultado.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  };

  const eliminarImagen = () => {
    setImagenUri(null);
  };

  /** Envío de reporte con validación */
  const handleSubmit = async () => {
    if (!descripcion.trim() || descripcion.trim().length < 10) {
      Alert.alert(
        'Descripción requerida',
        'Por favor describe la situación con al menos 10 caracteres para que los rescatistas sepan qué equipo enviar.'
      );
      return;
    }

    if (!ubicacion) {
      Alert.alert(
        'Ubicación requerida',
        'Necesitamos capturar tus coordenadas GPS para despachar ayuda inmediata. Presiona "Reintentar GPS".',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reintentar GPS', onPress: refrescar },
        ]
      );
      return;
    }

    const catObj = CATEGORIAS_RAPIDAS.find((c) => c.id === categoriaSeleccionada);
    const prefijo = catObj ? `[${catObj.label.toUpperCase()}] ` : '';

    const data: CrearEmergenciaData = {
      descripcion: `${prefijo}${descripcion.trim()}`,
      latitud: ubicacion.latitud,
      longitud: ubicacion.longitud,
    };

    if (imagenUri) {
      const nombreArchivo = imagenUri.split('/').pop()?.split('?')[0] || 'evidencia.jpg';
      const tipoMime = /\.png$/i.test(nombreArchivo)
        ? 'image/png'
        : /\.webp$/i.test(nombreArchivo)
          ? 'image/webp'
          : 'image/jpeg';
      const archivo = new FormData();
      archivo.append('archivo', { uri: imagenUri, name: nombreArchivo, type: tipoMime } as any);

      const respuesta = await api.post('/emergencias/evidencias', archivo, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const evidenciaUrl = respuesta.data?.datos?.evidencia_url;
      if (!evidenciaUrl) throw new Error('El servidor no devolvió la ruta de la foto.');
      data.evidencia_url = evidenciaUrl;
    }

    await onSubmit(data);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Banner de llamada rápida al 911 */}
      <View style={styles.emergencyBanner}>
        <Ionicons name="call" size={18} color="#b91c1c" />
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>¿Peligro de muerte inminente?</Text>
          <Text style={styles.bannerSubtitle}>Llama gratis y directo a los servicios de emergencia</Text>
        </View>
        <TouchableOpacity
          style={styles.call911Button}
          onPress={() => Linking.openURL('tel:911')}
        >
          <Text style={styles.call911Text}>911</Text>
        </TouchableOpacity>
      </View>

      {/* 1. Selector de Tipo de Emergencia */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Tipo de Incidente</Text>
        <View style={styles.categoriesGrid}>
          {CATEGORIAS_RAPIDAS.map((cat) => {
            const isSelected = categoriaSeleccionada === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, isSelected && styles.catChipActive]}
                onPress={() => setCategoriaSeleccionada(cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={isSelected ? '#ffffff' : Colors.text}
                />
                <Text style={[styles.catText, isSelected && styles.catTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2. Coordenadas GPS */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>2. Ubicación GPS en Tiempo Real</Text>
          <TouchableOpacity onPress={refrescar} style={styles.refreshBadge}>
            <Ionicons name="refresh" size={14} color={Colors.primary} />
            <Text style={styles.refreshBadgeText}>Actualizar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gpsContainer}>
          {cargandoUbicacion ? (
            <View style={styles.gpsRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.gpsStatusText}>Fijando coordenadas satelitales...</Text>
            </View>
          ) : ubicacion ? (
            <View style={styles.gpsSuccessRow}>
              <View style={styles.gpsIconCircle}>
                <Ionicons name="locate" size={20} color={Colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsTitle}>Ubicación fijada con alta precisión</Text>
                <Text style={styles.gpsCoords}>
                  Latitud: {ubicacion.latitud.toFixed(6)} | Longitud: {ubicacion.longitud.toFixed(6)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.gpsErrorRow}>
              <Ionicons name="warning" size={20} color={Colors.danger} />
              <Text style={styles.gpsErrorText}>
                {errorUbicacion || 'No se pudo obtener el GPS. Verifica los permisos.'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 3. Descripción de los Hechos */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>3. Descripción del Suceso *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe brevemente: personas heridas, puntos de referencia cercanos, vehículos involucrados..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={descripcion}
          onChangeText={setDescripcion}
          maxLength={500}
          editable={!enviando}
        />
        <View style={styles.charCounter}>
          <Text style={styles.counterText}>Mínimo 10 car. ({descripcion.length}/500)</Text>
        </View>
      </View>

      {/* 4. Evidencia Multimedia */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>4. Foto de la Escena (Opcional)</Text>
        {imagenUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imagenUri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={eliminarImagen}
              disabled={enviando}
            >
              <Ionicons name="trash" size={18} color="#fff" />
              <Text style={styles.removeImageText}>Eliminar Foto</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoActionsRow}>
            <TouchableOpacity
              style={styles.photoActionBtn}
              onPress={tomarFoto}
              disabled={enviando}
            >
              <Ionicons name="camera" size={24} color={Colors.primary} />
              <Text style={styles.photoActionText}>Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoActionBtn}
              onPress={seleccionarGaleria}
              disabled={enviando}
            >
              <Ionicons name="images" size={24} color={Colors.primary} />
              <Text style={styles.photoActionText}>Galería</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Botón de Emergencia Prominente */}
      <TouchableOpacity
        style={[styles.submitButton, enviando && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={enviando}
        activeOpacity={0.85}
      >
        {enviando ? (
          <View style={styles.submitLoadingRow}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.submitButtonText}>ENVIANDO AL CENTRO DE COMANDO...</Text>
          </View>
        ) : (
          <View style={styles.submitLoadingRow}>
            <Ionicons name="radio" size={24} color="#ffffff" />
            <Text style={styles.submitButtonText}>ENVIAR REPORTE SOS</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={{ height: Spacing.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: '#f8fafc',
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 4,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: FontSize.xs + 1,
    fontWeight: 'bold',
    color: '#991b1b',
  },
  bannerSubtitle: {
    fontSize: FontSize.xs - 1,
    color: '#b91c1c',
  },
  call911Button: {
    backgroundColor: '#dc2626',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  call911Text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: FontSize.sm,
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
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs + 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
    marginTop: 4,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.text,
  },
  catTextActive: {
    color: '#ffffff',
  },
  refreshBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#eff6ff',
    borderRadius: BorderRadius.sm,
  },
  refreshBadgeText: {
    fontSize: FontSize.xs - 1,
    fontWeight: '600',
    color: Colors.primary,
  },
  gpsContainer: {
    marginTop: 4,
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gpsStatusText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  gpsSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gpsIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#166534',
  },
  gpsCoords: {
    fontSize: FontSize.xs - 1,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  gpsErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gpsErrorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    flex: 1,
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: Spacing.sm + 2,
    fontSize: FontSize.sm,
    color: Colors.text,
    minHeight: 90,
  },
  charCounter: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  counterText: {
    fontSize: FontSize.xs - 1,
    color: Colors.textSecondary,
  },
  imagePreviewContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
  },
  removeImageBtn: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  removeImageText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: 'bold',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
    gap: Spacing.xs + 2,
  },
  photoActionText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  submitButton: {
    backgroundColor: Colors.danger,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
    shadowColor: Colors.danger,
    shadowOpacity: 0.35,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: FontSize.md,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
