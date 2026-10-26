'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * Hook de Alertas Acústicas Sintetizadas mediante Web Audio API.
 * Genera tonos operativos nativos para centros de comando y despacho (CAD 123)
 * sin requerir dependencias de archivos de audio externos (MP3/WAV).
 */
export function useAlertSound() {
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  /** Obtiene o inicializa perezosamente el AudioContext */
  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  /**
   * Tono de Triage (Alerta entrante de nuevo reporte P1/P2)
   * Bitonal armónico (750 Hz -> 900 Hz) tipo consola 911 / 123
   */
  const playTriageAlert = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.setValueAtTime(900, now + 0.15);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.setValueAtTime(0.25, now + 0.28);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // Ignorar restricciones de autoplay si aún no hubo interacción del usuario
    }
  }, [getAudioContext, isMuted]);

  /**
   * Chirp de Despacho (Confirmación de radio VHF: 10-4 unidad despachada)
   * Barrido rápido de frecuencia descendente (1200 Hz -> 850 Hz)
   */
  const playDispatchChirp = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Autoplay fallback
    }
  }, [getAudioContext, isMuted]);

  /**
   * Alarma Crítica P1 (Triple pulso perentorio de emergencia mayor)
   */
  const playCriticalAlarm = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [0, 0.12, 0.24].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now + delay);

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.18, now + delay + 0.01);
        gain.gain.linearRampToValueAtTime(0, now + delay + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.09);
      });
    } catch {
      // Autoplay fallback
    }
  }, [getAudioContext, isMuted]);

  return {
    isMuted,
    setIsMuted,
    toggleMute: () => setIsMuted((prev) => !prev),
    playTriageAlert,
    playDispatchChirp,
    playCriticalAlarm,
  };
}

export default useAlertSound;
