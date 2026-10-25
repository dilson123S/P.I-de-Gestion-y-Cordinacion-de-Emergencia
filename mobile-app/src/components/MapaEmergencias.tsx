/**
 * Componente MapaEmergencias - Vista de mapa con marcadores de emergencias.
 * Utiliza react-native-maps para mostrar las emergencias
 * geolocalizadas con colores según su estado actual.
 */

import React from 'react';
import { View, Text, StyleSheet, DimensionValue } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Emergencia, EstadoEmergencia } from '../types';
import { Colors, BorderRadius, Spacing, FontSize } from '../constants/theme';

interface MapaEmergenciasProps {
  /** Lista de emergencias a mostrar en el mapa */
  emergencias?: Emergencia[];
  /** Latitud inicial del centro del mapa */
  latitudInicial?: number;
  /** Longitud inicial del centro del mapa */
  longitudInicial?: number;
  /** Callback al presionar un marcador */
  onMarkerPress?: (emergencia: Emergencia) => void;
  /** Altura del contenedor del mapa */
  height?: DimensionValue;
}

/** Mapeo de colores de marcador por estado de emergencia */
const MARKER_COLORS: Record<EstadoEmergencia, string> = {
  [EstadoEmergencia.REPORTADO]: Colors.warning,
  [EstadoEmergencia.CLASIFICADO]: Colors.primary,
  [EstadoEmergencia.ASIGNADO]: Colors.purple,
  [EstadoEmergencia.EN_ATENCION]: Colors.orange,
  [EstadoEmergencia.CERRADO]: Colors.success,
};

/**
 * Mapa interactivo que muestra marcadores coloreados para cada emergencia.
 * Los colores de los marcadores corresponden al estado de cada emergencia.
 * Si no hay coordenadas iniciales, centra en una ubicación por defecto.
 */
export default function MapaEmergencias({
  emergencias = [],
  latitudInicial = 10.411,
  longitudInicial = -75.53,
  onMarkerPress,
  height = 300,
}: MapaEmergenciasProps) {
  // Centro inicial del mapa
  const primerPunto = emergencias.find(
    (e) => typeof e.latitud === 'number' && typeof e.longitud === 'number'
  );

  const region = {
    latitude: primerPunto ? Number(primerPunto.latitud) : latitudInicial,
    longitude: primerPunto ? Number(primerPunto.longitud) : longitudInicial,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
      >
        {emergencias
          .filter((e) => typeof e.latitud === 'number' && typeof e.longitud === 'number')
          .map((emergencia) => (
            <Marker
              key={emergencia.id.toString()}
              coordinate={{
                latitude: Number(emergencia.latitud),
                longitude: Number(emergencia.longitud),
              }}
              title={`Caso #${emergencia.id}: ${emergencia.tipo_emergencia?.nombre || 'Emergencia'}`}
              description={emergencia.descripcion.substring(0, 60)}
              pinColor={MARKER_COLORS[emergencia.estado] || Colors.danger}
              onPress={() => onMarkerPress?.(emergencia)}
            />
          ))}
      </MapView>

      {/* Leyenda de colores */}
      <View style={styles.leyenda}>
        {Object.entries(MARKER_COLORS).map(([estado, color]) => (
          <View key={estado} style={styles.leyendaItem}>
            <View style={[styles.leyendaDot, { backgroundColor: color }]} />
            <Text style={styles.leyendaText}>{estado.replace(/_/g, ' ')}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  map: {
    flex: 1,
  },
  leyenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  leyendaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leyendaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
});
