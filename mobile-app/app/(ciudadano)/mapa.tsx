import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapaEmergencias from '../../src/components/MapaEmergencias';
import { Colors } from '../../src/constants/theme';

export default function MapaScreen() {
  return (
    <View style={styles.container}>
      <MapaEmergencias />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
