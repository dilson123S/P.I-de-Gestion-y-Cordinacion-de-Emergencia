import { io } from './server';
import type { Emergencia, Caso, GpsPoint } from './types';

/** Emite una alerta de SOS cuando se crea una nueva emergencia */
export const emitSosAlert = (emergencia: Emergencia | any) => {
  if (io) {
    io.emit('sos:alert', emergencia);
  }
};

/** Emite una actualización de caso (clasificar, asignar, iniciar, cerrar) */
export const emitCaseUpdate = (caso: Caso | any) => {
  if (io) {
    io.emit('case:update', caso);
  }
};

/** Emite la posición GPS en tiempo real de una unidad */
export const emitGpsUpdate = (gps: GpsPoint | any) => {
  if (io) {
    io.emit('gps:update', gps);
  }
};
