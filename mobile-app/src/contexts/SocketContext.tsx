/**
 * Contexto de WebSockets para comunicación en tiempo real en la app móvil.
 * Conecta con el servidor Socket.io de SIGEM y escucha alertas de SOS,
 * despachos de unidades (case:update) y actualizaciones de posición GPS.
 */

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Alert, Vibration, Platform } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { obtenerToken } from '../lib/auth';
import { Emergencia, EstadoEmergencia, RolUsuario } from '../types';

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  ultimaEmergencia: Emergencia | null;
  enviarGpsUpdate: (latitud: number, longitud: number) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  ultimaEmergencia: null,
  enviarGpsUpdate: () => {},
});

/** Determina la URL del servidor WebSocket */
const obtenerSocketUrl = (): string => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  return apiUrl.replace(/\/api\/v1\/?$/, '');
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { usuario, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ultimaEmergencia, setUltimaEmergencia] = useState<Emergencia | null>(null);
  const socketRef = useRef<Socket | null>(null);

  /** Maneja las alertas en tiempo real según el rol del usuario conectado */
  const procesarActualizacionCaso = useCallback(
    (caso: Emergencia) => {
      setUltimaEmergencia(caso);

      // Si es PERSONAL DE CAMPO y se le despacha una emergencia
      if (usuario?.rol === RolUsuario.PERSONAL_CAMPO) {
        if (caso.estado === EstadoEmergencia.ASIGNADO) {
          // Vibración táctica de alerta de despacho (patrón: esperar 0, vibrar 500ms, pausa 200ms, vibrar 500ms)
          Vibration.vibrate([0, 500, 200, 500]);

          Alert.alert(
            '🚨 ¡NUEVO DESPACHO ASIGNADO!',
            `Caso #${caso.id}: ${caso.tipo_emergencia?.nombre || 'Emergencia'}\n\n${caso.descripcion}\n\nInstrucciones: ${
              caso.notas_despacho || 'Dirigirse a las coordenadas de inmediato.'
            }`,
            [{ text: 'ENTENDIDO / ACEPTAR MISIÓN' }]
          );
        }
      }

      // Si es CIUDADANO y su propio reporte cambia de estado
      if (usuario?.rol === RolUsuario.CIUDADANO) {
        const esMio =
          String(caso.id_ciudadano) === String(usuario.id) ||
          String(caso.reporteroId) === String(usuario.id);

        if (esMio) {
          Vibration.vibrate(400);

          let mensaje = '';
          switch (caso.estado) {
            case EstadoEmergencia.CLASIFICADO:
              mensaje = 'Tu reporte ha sido validado y clasificado por el Centro de Comando.';
              break;
            case EstadoEmergencia.ASIGNADO:
              mensaje = `🚨 ¡Atención en camino! Se ha despachado una unidad (${
                caso.unidad?.tipo || 'Unidad de Rescate'
              }) a tu ubicación.`;
              break;
            case EstadoEmergencia.EN_ATENCION:
              mensaje = 'La unidad de emergencia ha arribado y se encuentra operando en la escena.';
              break;
            case EstadoEmergencia.CERRADO:
              mensaje = 'Tu reporte ha sido atendido y cerrado con éxito.';
              break;
            default:
              mensaje = `El estado de tu reporte ha cambiado a ${caso.estado}.`;
          }

          Alert.alert(`Actualización Caso #${caso.id}`, mensaje, [{ text: 'Entendido' }]);
        }
      }
    },
    [usuario]
  );

  useEffect(() => {
    let socketInstance: Socket | null = null;

    const iniciarSocket = async () => {
      const token = await obtenerToken();
      const socketUrl = obtenerSocketUrl();

      socketInstance = io(socketUrl, {
        auth: { token: token || undefined },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 15,
        reconnectionDelay: 2500,
        autoConnect: true,
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        setIsConnected(true);
        console.log('🟢 [Socket Mobile] Conectado en tiempo real al servidor SIGEM');
      });

      socketInstance.on('disconnect', (reason) => {
        setIsConnected(false);
        console.log('🔴 [Socket Mobile] Desconectado:', reason);
      });

      socketInstance.on('connect_error', (err) => {
        setIsConnected(false);
        console.warn('⚠️ [Socket Mobile] Error de conexión:', err.message);
      });

      // Evento: Alerta SOS global creada
      socketInstance.on('sos:alert', (nuevaEmergencia: Emergencia) => {
        setUltimaEmergencia(nuevaEmergencia);
      });

      // Evento: Actualización de ciclo de vida (clasificación, asignación, atención, cierre)
      socketInstance.on('case:update', (casoActualizado: Emergencia) => {
        procesarActualizacionCaso(casoActualizado);
      });
    };

    iniciarSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, procesarActualizacionCaso]);

  /** Emite posición GPS de la unidad en campo */
  const enviarGpsUpdate = useCallback(
    (latitud: number, longitud: number) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('gps:update', {
          id_usuario: usuario?.id,
          unidad_id: usuario?.unidadId || usuario?.unidad_asignada?.id,
          latitud,
          longitud,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [isConnected, usuario]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        ultimaEmergencia,
        enviarGpsUpdate,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe usarse dentro de un SocketProvider');
  }
  return context;
}

export default SocketContext;
