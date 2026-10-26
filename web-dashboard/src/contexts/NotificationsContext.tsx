'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { api } from '@/lib/api';
import { Emergencia } from '@/types';

export type TipoNotificacion = 'critica' | 'alerta' | 'info' | 'exito';

export interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  fecha: string; // ISO String
  leida: boolean;
  enlace?: string;
  casoId?: number;
  categoria?: string;
}

interface NotificationsContextType {
  notificaciones: Notificacion[];
  noLeidasCount: number;
  criticasCount: number;
  marcarComoLeida: (id: string) => void;
  marcarTodasComoLeidas: () => void;
  eliminarNotificacion: (id: string) => void;
  limpiarTodas: () => void;
  agregarNotificacion: (
    notif: Omit<Notificacion, 'id' | 'fecha' | 'leida'> & { id?: string; leida?: boolean }
  ) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const STORAGE_KEY = 'sigem_notificaciones_v2';
const READ_IDS_KEY = 'sigem_notificaciones_leidas_v2';

/**
 * Notificaciones iniciales de demostración para asegurar datos operativos en frío
 */
const NOTIFICACIONES_DEMO: Notificacion[] = [
  {
    id: 'demo-1',
    titulo: 'Alerta SOS en Triage #1',
    mensaje: 'Colisión vehicular múltiple con atrapados en Av. Pedro de Heredia. Requiere ambulancia.',
    tipo: 'critica',
    fecha: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    leida: false,
    enlace: '/dashboard/emergencias/1',
    casoId: 1,
    categoria: 'ACCIDENTE_TRANSITO',
  },
  {
    id: 'demo-2',
    titulo: 'Despacho de Unidad Confirmado #2',
    mensaje: 'Ambulancia TAM-01 despachada hacia Manga Callejón Real. ETA estimada: 6 minutos.',
    tipo: 'info',
    fecha: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    leida: false,
    enlace: '/dashboard/emergencias/2',
    casoId: 2,
    categoria: 'INCIDENTE_MEDICO',
  },
  {
    id: 'demo-3',
    titulo: 'Conato de Incendio Controlado #3',
    mensaje: 'Cuerpo de Bomberos B-04 liquidó fuego en Bocagrande. Caso cerrado formalmente.',
    tipo: 'exito',
    fecha: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    leida: true,
    enlace: '/dashboard/emergencias/3',
    casoId: 3,
    categoria: 'INCENDIO',
  },
];

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargado, setCargado] = useState(false);

  // 1. Cargar estado persistente en el montaje
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const guardadas = localStorage.getItem(STORAGE_KEY);
      if (guardadas) {
        const parsed = JSON.parse(guardadas);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotificaciones(parsed);
          setCargado(true);
          return;
        }
      }
    } catch (e) {
      console.warn('Error al leer notificaciones guardadas:', e);
    }

    // Si no había guardadas, inicializar con las de demostración
    setNotificaciones(NOTIFICACIONES_DEMO);
    setCargado(true);
  }, []);

  // 2. Sincronizar periódicamente con casos reales del backend
  const sincronizarConBackend = useCallback(async () => {
    try {
      const res = await api.get('/emergencias?limite=10');
      const emergencias: Emergencia[] = res.data?.datos?.emergencias || [];

      if (emergencias.length === 0) return;

      const readIds = new Set<string>();
      try {
        const guardadosRead = localStorage.getItem(READ_IDS_KEY);
        if (guardadosRead) {
          JSON.parse(guardadosRead).forEach((id: string) => readIds.add(id));
        }
      } catch {}

      setNotificaciones((prev) => {
        const existentesMap = new Map(prev.map((n) => [n.id, n]));

        emergencias.forEach((e) => {
          const id = `eme-${e.id}`;
          if (!existentesMap.has(id)) {
            const esCritica = e.prioridad === 1 || e.prioridad === 2 || (e.prioridad as any) === 'CRITICA' || (e.prioridad as any) === 'ALTA';
            const yaLeida = readIds.has(id);

            let tipo: TipoNotificacion = 'info';
            let titulo = `Incidente #${e.id}`;
            if (e.estado === 'REPORTADO') {
              tipo = esCritica ? 'critica' : 'alerta';
              titulo = `Nueva Alerta SOS #${e.id}`;
            } else if (e.estado === 'CLASIFICADO') {
              tipo = 'alerta';
              titulo = `Caso #${e.id} listo para despacho`;
            } else if (e.estado === 'CERRADO') {
              tipo = 'exito';
              titulo = `Incidente #${e.id} Resuelto`;
            }

            existentesMap.set(id, {
              id,
              titulo,
              mensaje: `${e.tipo_emergencia?.nombre || 'Emergencia'}: ${e.descripcion || 'Sin detalles'}`,
              tipo,
              fecha: e.fecha_creacion || new Date().toISOString(),
              leida: yaLeida,
              enlace: `/dashboard/emergencias/${e.id}`,
              casoId: e.id,
              categoria: e.tipo_emergencia?.nombre,
            });
          }
        });

        // Ordenar por fecha descendente
        return Array.from(existentesMap.values()).sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
      });
    } catch {
      // Si el backend no responde, mantenemos la lista actual
    }
  }, []);

  useEffect(() => {
    if (cargado) {
      sincronizarConBackend();
    }
  }, [cargado, sincronizarConBackend]);

  // 3. Persistir en localStorage ante cualquier cambio
  useEffect(() => {
    if (!cargado || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notificaciones));
      const readIds = notificaciones.filter((n) => n.leida).map((n) => n.id);
      localStorage.setItem(READ_IDS_KEY, JSON.stringify(readIds));
    } catch (e) {
      console.warn('Error al persistir notificaciones:', e);
    }
  }, [notificaciones, cargado]);

  // 4. Escuchar eventos WebSocket en tiempo real
  useEffect(() => {
    if (!socket) return;

    const handleSosAlert = (emergencia: Emergencia) => {
      const nueva: Notificacion = {
        id: `sos-${emergencia.id || Date.now()}`,
        titulo: `🚨 NUEVA ALERTA SOS #${emergencia.id || 'NUEVA'}`,
        mensaje: `${emergencia.tipo_emergencia?.nombre || 'Emergencia'}: ${emergencia.descripcion || 'Incidente en tiempo real'}`,
        tipo: 'critica',
        fecha: new Date().toISOString(),
        leida: false,
        enlace: emergencia.id ? `/dashboard/emergencias/${emergencia.id}` : '/dashboard/emergencias?estado=REPORTADO',
        casoId: emergencia.id,
        categoria: emergencia.tipo_emergencia?.nombre,
      };

      setNotificaciones((prev) => [nueva, ...prev.filter((n) => n.id !== nueva.id)]);
    };

    const handleActualizacion = (emergencia: Emergencia) => {
      const nueva: Notificacion = {
        id: `act-${emergencia.id}-${Date.now()}`,
        titulo: `Estado Actualizado #${emergencia.id}`,
        mensaje: `El incidente ha cambiado su estado a ${emergencia.estado}.`,
        tipo: emergencia.estado === 'CERRADO' ? 'exito' : 'info',
        fecha: new Date().toISOString(),
        leida: false,
        enlace: `/dashboard/emergencias/${emergencia.id}`,
        casoId: emergencia.id,
      };

      setNotificaciones((prev) => [nueva, ...prev]);
    };

    socket.on('sos:alert', handleSosAlert);
    socket.on('emergencia:actualizada', handleActualizacion);

    return () => {
      socket.off('sos:alert', handleSosAlert);
      socket.off('emergencia:actualizada', handleActualizacion);
    };
  }, [socket]);

  // 5. Escuchar eventos DOM desacoplados en la ventana
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCustomNotif = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { titulo, mensaje, tipo, enlace, casoId } = customEvent.detail;
        const nueva: Notificacion = {
          id: `custom-${Date.now()}`,
          titulo: titulo || 'Notificación Operativa',
          mensaje: mensaje || '',
          tipo: tipo || 'info',
          fecha: new Date().toISOString(),
          leida: false,
          enlace,
          casoId,
        };
        setNotificaciones((prev) => [nueva, ...prev]);
      }
    };

    window.addEventListener('sigem:notificacion', handleCustomNotif);
    return () => {
      window.removeEventListener('sigem:notificacion', handleCustomNotif);
    };
  }, []);

  // Acciones operativas
  const marcarComoLeida = useCallback((id: string) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  }, []);

  const marcarTodasComoLeidas = useCallback(() => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  }, []);

  const eliminarNotificacion = useCallback((id: string) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const limpiarTodas = useCallback(() => {
    setNotificaciones([]);
  }, []);

  const agregarNotificacion = useCallback(
    (notif: Omit<Notificacion, 'id' | 'fecha' | 'leida'> & { id?: string; leida?: boolean }) => {
      const nueva: Notificacion = {
        id: notif.id || `notif-${Date.now()}`,
        titulo: notif.titulo,
        mensaje: notif.mensaje,
        tipo: notif.tipo,
        fecha: new Date().toISOString(),
        leida: notif.leida ?? false,
        enlace: notif.enlace,
        casoId: notif.casoId,
        categoria: notif.categoria,
      };
      setNotificaciones((prev) => [nueva, ...prev]);
    },
    []
  );

  const noLeidasCount = useMemo(
    () => notificaciones.filter((n) => !n.leida).length,
    [notificaciones]
  );

  const criticasCount = useMemo(
    () => notificaciones.filter((n) => !n.leida && n.tipo === 'critica').length,
    [notificaciones]
  );

  return (
    <NotificationsContext.Provider
      value={{
        notificaciones,
        noLeidasCount,
        criticasCount,
        marcarComoLeida,
        marcarTodasComoLeidas,
        eliminarNotificacion,
        limpiarTodas,
        agregarNotificacion,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications debe ser usado dentro de un NotificationsProvider');
  }
  return context;
}
