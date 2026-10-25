'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import type { Emergencia } from '@/types';

/**
 * Hook para sincronizar actualizaciones de casos en tiempo real ('case:update')
 * Notifica a las vistas cuando una emergencia cambia de estado:
 * REPORTADO -> CLASIFICADO -> ASIGNADO -> EN_ATENCION -> CERRADO
 */
export function useCaseSync() {
  const { socket } = useSocket();
  const [latestCaseUpdate, setLatestCaseUpdate] = useState<Emergencia | any | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleCaseUpdate = (caso: Emergencia | any) => {
      console.log('🔄 [Caso Actualizado recibido]:', caso);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('case:update', { detail: caso }));
        window.dispatchEvent(new CustomEvent('sigem:emergencia-actualizada', { detail: caso }));
      }

      setLatestCaseUpdate(caso);
    };

    socket.on('case:update', handleCaseUpdate);

    return () => {
      socket.off('case:update', handleCaseUpdate);
    };
  }, [socket]);

  const clearCaseUpdate = useCallback(() => {
    setLatestCaseUpdate(null);
  }, []);

  return {
    latestCaseUpdate,
    clearCaseUpdate,
  };
}

export default useCaseSync;
