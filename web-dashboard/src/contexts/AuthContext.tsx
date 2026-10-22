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
import type { Usuario, RespuestaAuth } from '@/types';

/* ─── Interfaz del contexto de autenticación ─── */

interface AuthContextType {
  /** Usuario autenticado actual */
  usuario: Usuario | null;
  /** Indica si la sesión está siendo verificada */
  cargando: boolean;
  /** Indica si el usuario ha iniciado sesión */
  estaAutenticado: boolean;
  /** Inicia sesión con email y contraseña */
  iniciarSesion: (email: string, contrasena: string) => Promise<void>;
  /** Cierra la sesión actual y redirige al login */
  cerrarSesion: () => void;
}

/* ─── Creación del contexto ─── */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ─── Proveedor de autenticación ─── */

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Proveedor del contexto de autenticación.
 * Gestiona el estado de sesión, verificación de token y persistencia del usuario.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  /**
   * Verifica la sesión existente al montar el componente.
   * Lee token y usuario almacenados en localStorage.
   */
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

  /**
   * Inicia sesión enviando credenciales a la API.
   * Almacena el token y los datos del usuario en localStorage.
   */
  const iniciarSesion = useCallback(
    async (email: string, contrasena: string) => {
      const respuesta = await api.post<RespuestaAuth>('/auth/login', {
        email,
        contrasena,
      });

      const { token, usuario: datosUsuario } = respuesta.data;

      guardarToken(token);
      guardarUsuario(datosUsuario as unknown as Record<string, unknown>);
      setUsuario(datosUsuario);

      router.push('/dashboard');
    },
    [router]
  );

  /**
   * Cierra la sesión eliminando token y datos, luego redirige al login.
   */
  const cerrarSesion = useCallback(() => {
    eliminarToken();
    setUsuario(null);
    router.push('/login');
  }, [router]);

  const valor: AuthContextType = {
    usuario,
    cargando,
    estaAutenticado: usuario !== null,
    iniciarSesion,
    cerrarSesion,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acceder al contexto de autenticación.
 * Debe usarse dentro de un componente envuelto por AuthProvider.
 */
export function useAuthContext(): AuthContextType {
  const contexto = useContext(AuthContext);
  if (contexto === undefined) {
    throw new Error(
      'useAuthContext debe usarse dentro de un AuthProvider'
    );
  }
  return contexto;
}

export default AuthContext;
