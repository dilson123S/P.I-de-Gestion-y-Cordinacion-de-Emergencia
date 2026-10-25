'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, X, ExternalLink } from 'lucide-react';
import { useSosAlert } from '@/hooks/useSosAlert';
import { useCaseSync } from '@/hooks/useCaseSync';
import { useGpsSync } from '@/hooks/useGpsSync';

/**
 * Componente cliente que inicializa los escuchadores de WebSocket en segundo plano
 * y muestra alertas emergentes en pantalla ante eventos críticos.
 */
export default function RealtimeSync() {
  const { latestAlert, dismissAlert } = useSosAlert();
  useCaseSync();
  useGpsSync();

  if (!latestAlert) return null;

  return (
    <aside aria-label="Alerta de emergencia en vivo" className="fixed top-5 right-5 z-50 max-w-sm w-full animate-bounce">
      <div className="bg-red-600 text-white p-4 rounded-xl shadow-2xl border-2 border-red-400 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="font-bold text-sm uppercase tracking-wide flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" /> Nueva Alerta SOS
            </span>
          </div>
          <button
            onClick={dismissAlert}
            className="text-red-200 hover:text-white p-1 rounded-lg transition-colors"
            title="Descartar notificación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-red-100 font-medium">
          Caso #{latestAlert.id}: {latestAlert.descripcion || 'Sin descripción detallada'}
        </p>

        <div className="flex items-center justify-end gap-2 mt-1">
          <Link
            href={`/dashboard/emergencias/${latestAlert.id}`}
            onClick={dismissAlert}
            className="bg-white text-red-700 hover:bg-red-50 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
          >
            Atender Caso <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
