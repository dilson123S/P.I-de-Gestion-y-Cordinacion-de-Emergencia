/**
 * Utilidades geoespaciales para cálculo de distancias y tiempos estimados
 * de arribo (ETA) entre unidades y puntos de emergencia.
 */

/**
 * Calcula la distancia en kilómetros entre dos coordenadas geográficas
 * utilizando la fórmula de Haversine (toma en cuenta la curvatura terrestre).
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio medio de la Tierra en kilómetros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calcula el tiempo estimado de arribo (ETA) en minutos dado una distancia
 * y una velocidad promedio urbana en vehículo de emergencia (default: 40 km/h).
 */
export function calcularETA(distanciaKm: number, velocidadKmH: number = 40): number {
  if (distanciaKm <= 0) return 0;
  return (distanciaKm / velocidadKmH) * 60;
}

/**
 * Formatea la distancia de forma legible para la interfaz operativa.
 * Ejemplo: "2.8 km" o "450 m"
 */
export function formatearDistancia(km: number): string {
  if (km < 1) {
    const metros = Math.round(km * 1000);
    return `${metros} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Formatea el ETA de forma clara.
 * Ejemplo: "5 min", "< 1 min" o "18 min"
 */
export function formatearETA(minutos: number): string {
  if (minutos <= 0.8) return '< 1 min';
  return `${Math.round(minutos)} min`;
}
