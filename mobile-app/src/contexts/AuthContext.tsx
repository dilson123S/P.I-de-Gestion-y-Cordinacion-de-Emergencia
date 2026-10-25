/**
 * Contexto de autenticación para la aplicación SIGEM.
 * Provee estado de autenticación, datos del usuario y funciones
 * de login, logout y registro a toda la aplicación mediante Context API.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Usuario, LoginCredentials, RegistroData } from '../types';
import { RolUsuario } from '../types';
import { api } from '../lib/api';
import { guardarToken, guardarUsuario, limpiarSesion, obtenerToken, obtenerUsuario } from '../lib/auth';

/** Forma del contexto de autenticación */
export interface AuthContextType {
  /** Usuario autenticado actual */
  usuario: Usuario | null;
  user: Usuario | null;
  /** Indica si el usuario está autenticado */
  isAuthenticated: boolean;
  estaAutenticado: boolean;
  /** Indica si se está cargando el estado de autenticación */
  isLoading: boolean;
  estaCargando: boolean;
  /** Inicia sesión con email y contraseña (como objeto o argumentos individuales) */
  login: (credentialsOrEmail: LoginCredentials | string, passwordParam?: string) => Promise<Usuario>;
  iniciarSesion: (credentialsOrEmail: LoginCredentials | string, passwordParam?: string) => Promise<Usuario>;
  /** Registra un nuevo ciudadano */
  registro: (data: RegistroData) => Promise<void>;
  registrar: (data: RegistroData) => Promise<void>;
  /** Cierra la sesión actual */
  logout: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

/** Contexto con valores por defecto */
const AuthContext = createContext<AuthContextType>({
  usuario: null,
  user: null,
  isAuthenticated: false,
  estaAutenticado: false,
  isLoading: true,
  estaCargando: true,
  login: async () => ({} as Usuario),
  iniciarSesion: async () => ({} as Usuario),
  registro: async () => {},
  registrar: async () => {},
  logout: async () => {},
  cerrarSesion: async () => {},
});

/** Props del proveedor de autenticación */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Proveedor de autenticación que envuelve la aplicación.
 * Gestiona el estado de sesión, persistencia de tokens y
 * la comunicación con la API de autenticación.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Restaura la sesión desde AsyncStorage al montar */
  useEffect(() => {
    const restaurarSesion = async () => {
      try {
        const token = await obtenerToken();
        if (token) {
          const usuarioGuardado = await obtenerUsuario();
          if (usuarioGuardado) {
            setUsuario(usuarioGuardado);
          }
        }
      } catch (error) {
        console.error('Error al restaurar sesión:', error);
        await limpiarSesion();
      } finally {
        setIsLoading(false);
      }
    };

    restaurarSesion();
  }, []);

  /**
   * Inicia sesión con las credenciales proporcionadas.
   * Acepta { email, password } o (email, password).
   * Guarda el token y los datos del usuario en AsyncStorage.
   */
  const login = useCallback(
    async (credentialsOrEmail: LoginCredentials | string, passwordParam?: string): Promise<Usuario> => {
      const payload: LoginCredentials =
        typeof credentialsOrEmail === 'string'
          ? { email: credentialsOrEmail, password: passwordParam || '' }
          : credentialsOrEmail;

      const response = await api.post('/auth/login', payload);
      const data = response.data?.datos || response.data;
      const token = data?.token;
      const usuarioData: Usuario = data?.usuario;

      if (!token || !usuarioData) {
        throw new Error('Respuesta de autenticación inválida del servidor');
      }

      await guardarToken(token);
      await guardarUsuario(usuarioData);
      setUsuario(usuarioData);
      return usuarioData;
    },
    []
  );

  /**
   * Registra un nuevo ciudadano en el sistema.
   * Conecta con POST /api/v1/auth/registrar y asigna rol CIUDADANO si no se especifica.
   */
  const registro = useCallback(async (data: RegistroData) => {
    const payload = {
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      telefono: data.telefono || null,
      password: data.password,
      rol: data.rol || RolUsuario.CIUDADANO,
    };

    const response = await api.post('/auth/registrar', payload);
    const result = response.data?.datos || response.data;

    // Si la API retorna token y usuario, inicia sesión automáticamente
    if (result?.token && result?.usuario) {
      await guardarToken(result.token);
      await guardarUsuario(result.usuario);
      setUsuario(result.usuario);
    }
  }, []);

  /**
   * Cierra la sesión del usuario actual.
   * Limpia todos los datos persistidos de la sesión.
   */
  const logout = useCallback(async () => {
    await limpiarSesion();
    setUsuario(null);
  }, []);

  const value: AuthContextType = {
    usuario,
    user: usuario,
    isAuthenticated: !!usuario,
    estaAutenticado: !!usuario,
    isLoading,
    estaCargando: isLoading,
    login,
    iniciarSesion: login,
    registro,
    registrar: registro,
    logout,
    cerrarSesion: logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acceder al contexto de autenticación.
 * Debe usarse dentro de un AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
