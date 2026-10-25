'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import type { Emergencia } from '@/types';

/**
 * Reproduce un tono sonoro de alerta de emergencia mediante Web Audio API
 */
function playEmergencyTone() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35); // A4

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (err) {
    console.debug('No se pudo reproducir audio de alerta:', err);
  }
}

/**
 * Hook para escuchar eventos en tiempo real de nuevas emergencias ('sos:alert')
 */
export function useSosAlert() {
  const { socket } = useSocket();
  const [latestAlert, setLatestAlert] = useState<Emergencia | null>(null);
  const [alerts, setAlerts] = useState<Emergencia[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleSosAlert = (emergencia: Emergencia) => {
      console.log('🚨 [SOS Alert recibido]:', emergencia);

      // Reproducir sonido de alerta
      playEmergencyTone();

      // Solicitar y emitir notificación nativa del navegador si aplica
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            new Notification('🚨 NUEVA EMERGENCIA REPORTADA', {
              body: `ID #${emergencia.id}: ${emergencia.descripcion || 'Sin descripción'}`,
              icon: '/favicon.ico',
            });
          } catch (e) {
            console.debug('Error al mostrar notificación nativa:', e);
          }
        } else if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }

      // Despachar evento para componentes desacoplados
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sos:alert', { detail: emergencia }));
        window.dispatchEvent(new CustomEvent('sigem:emergencia-actualizada', { detail: emergencia }));
      }

      setLatestAlert(emergencia);
      setAlerts((prev) => [emergencia, ...prev.slice(0, 19)]);
    };

    socket.on('sos:alert', handleSosAlert);

    return () => {
      socket.off('sos:alert', handleSosAlert);
    };
  }, [socket]);

  const dismissAlert = useCallback(() => {
    setLatestAlert(null);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setLatestAlert(null);
  }, []);

  return {
    latestAlert,
    alerts,
    dismissAlert,
    clearAlerts,
    playEmergencyTone,
  };
}

export default useSosAlert;
