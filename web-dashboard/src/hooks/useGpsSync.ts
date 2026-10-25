'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';

export interface GpsUpdatePayload {
  unitId: number;
  lat: number;
  lng: number;
  timestamp?: string | Date;
  [key: string]: any;
}

/**
 * Hook para sincronizar posiciones GPS de unidades de respuesta en vivo ('gps:update')
 */
export function useGpsSync() {
  const { socket } = useSocket();
  const [latestGpsUpdate, setLatestGpsUpdate] = useState<GpsUpdatePayload | null>(null);
  const [unitLocations, setUnitLocations] = useState<Record<number, GpsUpdatePayload>>({});

  useEffect(() => {
    if (!socket) return;

    const handleGpsUpdate = (data: GpsUpdatePayload) => {
      if (!data || typeof data.unitId === 'undefined') return;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gps:update', { detail: data }));
      }

      setLatestGpsUpdate(data);
      setUnitLocations((prev) => ({
        ...prev,
        [data.unitId]: data,
      }));
    };

    socket.on('gps:update', handleGpsUpdate);

    return () => {
      socket.off('gps:update', handleGpsUpdate);
    };
  }, [socket]);

  return {
    latestGpsUpdate,
    unitLocations,
  };
}

export default useGpsSync;
