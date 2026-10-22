/**
 * Contexto de autenticación para la aplicación SIGEM.
 * Provee estado de autenticación, datos del usuario y funciones
 * de login, logout y registro a toda la aplicación mediante Context API.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Usuario, LoginCredentials, RegistroData, AuthResponse } from '../types';
import { Rol } from '../types';
import api from '../lib/api';
import { guardarToken, guardarUsuario, limpiarSesion, obtenerToken, obtenerUsuario } from '../lib/auth';

/** Forma del contexto de autenticación */
interface AuthContextType {
  /** Usuario autenticado actual */
  usuario: Usuario | null;
  /** Indica si el usuario está autenticado */
  isAuthenticated: boolean;
  /** Indica si se está cargando el estado de autenticación */
  isLoading: boolean;
  /** Inicia sesión con email y contraseña */
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Registra un nuevo ciudadano */
  registro: (data: RegistroData) => Promise<void>;
  /** Cierra la sesión actual */
  logout: () => Promise<void>;
}

/** Contexto con valores por defecto */
const AuthContext = createContext<AuthContextType>({
  usuario: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  registro: async () => {},
  logout: async () => {},
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
          } else {
            // Si hay token pero no usuario, intentar obtener perfil
            try {
              const response = await api.get<Usuario>('/auth/perfil');
              setUsuario(response.data);
              await guardarUsuario(response.data);
            } catch {
              // Token inválido o expirado
              await limpiarSesion();
            }
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
   * Guarda el token y los datos del usuario en AsyncStorage.
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const { token, usuario: usuarioData } = response.data;

    await guardarToken(token);
    await guardarUsuario(usuarioData);
    setUsuario(usuarioData);
  }, []);

  /**
   * Registra un nuevo ciudadano en el sistema.
   * Automáticamente asigna el rol CIUDADANO e inicia sesión.
   */
  const registro = useCallback(async (data: RegistroData) => {
    const payload = { ...data, rol: Rol.CIUDADANO };
    const response = await api.post<AuthResponse>('/auth/registro', payload);
    const { token, usuario: usuarioData } = response.data;

    await guardarToken(token);
    await guardarUsuario(usuarioData);
    setUsuario(usuarioData);
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
    isAuthenticated: !!usuario,
    isLoading,
    login,
    registro,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
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
