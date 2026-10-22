import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
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
      await api.post('/emergencias', data);
      Alert.alert(
        'Emergencia Reportada',
        'Tu reporte ha sido registrado exitosamente en el Centro de Comando (RF-01). El operador más cercano iniciará el triage y despacho.',
        [{ text: 'Entendido', onPress: () => router.replace('/(ciudadano)/inicio') }]
      );
    } catch (err: any) {
      Alert.alert('Error al reportar', err?.response?.data?.mensaje || 'No se pudo enviar el reporte');
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
