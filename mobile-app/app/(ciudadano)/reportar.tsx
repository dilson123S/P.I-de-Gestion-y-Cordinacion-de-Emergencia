import React, { useState } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import FormularioReporte from '../../src/components/FormularioReporte';
import { api } from '../../src/lib/api';
import { Colors } from '../../src/constants/theme';
import { CrearEmergenciaData } from '../../src/types';

export default function ReportarScreen() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (data: CrearEmergenciaData) => {
    setEnviando(true);
    try {
      let urlEvidenciaServidor = data.evidencia_url;

      // Si se adjuntó una foto o video local, subirlo primero vía multipart/form-data
      if (
        urlEvidenciaServidor &&
        (urlEvidenciaServidor.startsWith('file:') ||
          urlEvidenciaServidor.startsWith('content:') ||
          urlEvidenciaServidor.startsWith('blob:') ||
          urlEvidenciaServidor.startsWith('data:'))
      ) {
        try {
          const formData = new FormData();
          const nombreArchivo = urlEvidenciaServidor.split('/').pop() || `evidencia_${Date.now()}.jpg`;
          const extMatch = /\.(\w+)$/.exec(nombreArchivo);
          const mimeType = extMatch ? `image/${extMatch[1]}` : 'image/jpeg';

          if (Platform.OS === 'web') {
            // En web fetch blob
            const blobRes = await fetch(urlEvidenciaServidor);
            const blob = await blobRes.blob();
            formData.append('archivo', blob, nombreArchivo);
          } else {
            // En Android/iOS React Native
            formData.append('archivo', {
              uri: urlEvidenciaServidor,
              name: nombreArchivo,
              type: mimeType,
            } as any);
          }

          const uploadRes = await api.post('/emergencias/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          if (uploadRes.data?.datos?.url) {
            urlEvidenciaServidor = uploadRes.data.datos.url;
          }
        } catch (uploadError) {
          console.warn('Advertencia: la subida de evidencia falló, continuando con el reporte SOS:', uploadError);
        }
      }

      // Enviar reporte institucional a la API central
      await api.post('/emergencias', {
        ...data,
        evidencia_url: urlEvidenciaServidor,
      });

      Alert.alert(
        '🚨 Emergencia Reportada con Éxito',
        'Tu reporte ha sido registrado en la Central de Coordinación 123 (RF-01). El operador más cercano iniciará el triage y despacho inmediato de auxilio.',
        [{ text: 'Entendido', onPress: () => router.replace('/(ciudadano)/inicio') }]
      );
    } catch (err: any) {
      Alert.alert(
        'Error al reportar',
        err?.response?.data?.mensaje || 'No se pudo enviar el reporte. Verifica tu conexión e inténtalo de nuevo.'
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.container}>
      <FormularioReporte onSubmit={handleSubmit} enviando={enviando} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
