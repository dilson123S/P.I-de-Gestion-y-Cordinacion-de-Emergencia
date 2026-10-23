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
      // El backend Express espera 'password'
      const respuesta = await api.post('/auth/login', {
        email,
        password: contrasena,
      });

      // La API responde con estructura: { exito: true, datos: { token, usuario } }
      const token = respuesta.data?.datos?.token || respuesta.data?.token;
      const datosUsuario = respuesta.data?.datos?.usuario || respuesta.data?.usuario;

      if (!token || !datosUsuario) {
        throw new Error('Respuesta de autenticación inválida del servidor');
      }

      guardarToken(token);
      guardarUsuario(datosUsuario);
      setUsuario(datosUsuario);

      router.push('/dashboard');
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
