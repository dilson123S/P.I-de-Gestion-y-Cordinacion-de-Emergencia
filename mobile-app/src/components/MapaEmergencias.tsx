/**
 * Componente MapaEmergencias - Vista de mapa con marcadores de emergencias.
 * Soporta plataformas nativas (iOS / Android con react-native-maps)
 * y modo Web seguro con telemetría geoespacial y enlaces directos.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  DimensionValue,
  Platform,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Emergencia, EstadoEmergencia } from '../types';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '../constants/theme';

let MapView: any = null;
let Marker: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch {
    // Fallback defensivo si react-native-maps no se encuentra en el runtime
  }
}

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

export default function MapaEmergencias({
  emergencias = [],
  latitudInicial = 10.411,
  longitudInicial = -75.53,
  onMarkerPress,
  height = 300,
}: MapaEmergenciasProps) {
  const puntosValidos = emergencias.filter(
    (e) => typeof e.latitud === 'number' && typeof e.longitud === 'number'
  );

  const primerPunto = puntosValidos[0];

  const region = {
    latitude: primerPunto ? Number(primerPunto.latitud) : latitudInicial,
    longitude: primerPunto ? Number(primerPunto.longitud) : longitudInicial,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  };

  // Render para entorno Web (fallback interactivo)
  if (Platform.OS === 'web' || !MapView) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.webHeader}>
          <View style={styles.webHeaderTitleRow}>
            <Ionicons name="compass" size={18} color={Colors.primary} />
            <Text style={styles.webHeaderTitle}>Visualización Geoespacial</Text>
          </View>
          <Text style={styles.webHeaderSubtitle}>
            {puntosValidos.length} incidentes geolocalizados en Cartagena
          </Text>
        </View>

        <ScrollView style={styles.webList} contentContainerStyle={{ padding: Spacing.sm, gap: 8 }}>
          {puntosValidos.length === 0 ? (
            <View style={styles.webEmpty}>
              <Ionicons name="map-outline" size={36} color="#94a3b8" />
              <Text style={styles.webEmptyText}>Sin coordenadas registradas actualmente</Text>
            </View>
          ) : (
            puntosValidos.map((e) => {
              const color = MARKER_COLORS[e.estado] || Colors.primary;
              const mapsUrl = `https://www.google.com/maps?q=${e.latitud},${e.longitud}`;
              return (
                <TouchableOpacity
                  key={e.id.toString()}
                  style={[styles.webItem, { borderLeftColor: color }]}
                  onPress={() => onMarkerPress?.(e)}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.webItemRow}>
                      <Text style={styles.webItemId}>Caso #{e.id}</Text>
                      <View style={[styles.webBadge, { backgroundColor: `${color}20` }]}>
                        <Text style={[styles.webBadgeText, { color }]}>{e.estado}</Text>
                      </View>
                    </View>
                    <Text style={styles.webItemDesc} numberOfLines={2}>
                      {e.descripcion}
                    </Text>
                    <Text style={styles.webItemCoords}>
                      📍 {Number(e.latitud).toFixed(4)}, {Number(e.longitud).toFixed(4)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(mapsUrl)}
                    style={styles.webExternalBtn}
                    accessibilityLabel="Abrir en Google Maps"
                  >
                    <Ionicons name="navigate-circle" size={24} color={Colors.primary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

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

  // Render Nativo (iOS / Android)
  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton
      >
        {puntosValidos.map((emergencia) => (
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  map: {
    flex: 1,
  },
  webHeader: {
    padding: Spacing.sm + 2,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  webHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  webHeaderTitle: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.text,
  },
  webHeaderSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  webList: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webEmpty: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webEmptyText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  webItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  webItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  webItemId: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: Colors.text,
  },
  webBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  webBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  webItemDesc: {
    fontSize: FontSize.xs,
    color: Colors.text,
    lineHeight: 16,
  },
  webItemCoords: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
    marginTop: 3,
  },
  webExternalBtn: {
    paddingLeft: Spacing.sm,
  },
  leyenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.sm,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
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
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
});
