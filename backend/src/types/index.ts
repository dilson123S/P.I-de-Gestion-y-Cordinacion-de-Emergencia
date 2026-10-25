export interface Emergencia {
  id: number;
  descripcion?: string;
  latitud?: number;
  longitud?: number;
  estado?: string;
  [key: string]: any;
}

export interface Caso {
  id: number;
  emergenciaId?: number;
  operadorId?: number;
  estado?: string;
  [key: string]: any;
}

export interface GpsPoint {
  unitId: number;
  lat: number;
  lng: number;
  timestamp?: Date | string;
  [key: string]: any;
}
