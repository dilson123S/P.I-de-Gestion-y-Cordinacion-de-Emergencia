'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  guardarToken,
  eliminarToken,
  obtenerToken,
  guardarUsuario,
  obtenerUsuarioStorage,
} from '@/lib/auth';
import type { Usuario } from '@/types';
import { mockUsuarios } from '@/lib/mock-data';

/* ─── Interfaz del contexto de autenticación ─── */

interface AuthContextType {
  usuario: Usuario | null;
  cargando: boolean;
  isLoading: boolean;
  estaAutenticado: boolean;
  isAuthenticated: boolean;
  iniciarSesion: (email: string, contrasena: string) => Promise<void>;
  login: (email: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verificarSesion = () => {
      const token = obtenerToken();
      const usuarioAlmacenado = obtenerUsuarioStorage();

      if (token && usuarioAlmacenado) {
        setUsuario(usuarioAlmacenado as unknown as Usuario);
      }
      setCargando(false);
    };

    verificarSesion();
  }, []);

  const iniciarSesion = useCallback(
    async (email: string, contrasena: string) => {
      try {
        // Intento de conexión con backend Express
        const respuesta = await api.post('/auth/login', {
          email,
          password: contrasena,
        });

        const token = respuesta.data?.datos?.token || respuesta.data?.token;
        const datosUsuario = respuesta.data?.datos?.usuario || respuesta.data?.usuario;

        if (token && datosUsuario) {
          guardarToken(token);
          guardarUsuario(datosUsuario);
          setUsuario(datosUsuario);
          router.push('/dashboard');
          return;
        }
      } catch (err: any) {
        // Modo fallback para pruebas locales si el backend no está encendido
        const esErrorConexion =
          err?.code === 'ERR_NETWORK' ||
          err?.message?.includes('Network Error') ||
          !err?.response;

        if (esErrorConexion) {
          const usuarioDemo =
            mockUsuarios.find((u) => u.email.toLowerCase() === email.toLowerCase()) ||
            mockUsuarios[1]; // Por defecto Operador

          const tokenDemo = 'jwt_demo_token_sigem';
          guardarToken(tokenDemo);
          guardarUsuario(usuarioDemo as unknown as Record<string, unknown>);
          setUsuario(usuarioDemo);
          router.push('/dashboard');
          return;
        }

        throw err;
      }
    },
    [router]
  );

  const cerrarSesion = useCallback(() => {
    eliminarToken();
    setUsuario(null);
    router.push('/login');
  }, [router]);

  const valor: AuthContextType = {
    usuario,
    cargando,
    isLoading: cargando,
    estaAutenticado: usuario !== null,
    isAuthenticated: usuario !== null,
    iniciarSesion,
    login: iniciarSesion,
    cerrarSesion,
    logout: cerrarSesion,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const contexto = useContext(AuthContext);
  if (contexto === undefined) {
    throw new Error('useAuthContext debe usarse dentro de un AuthProvider');
  }
  return contexto;
}

export default AuthContext;
