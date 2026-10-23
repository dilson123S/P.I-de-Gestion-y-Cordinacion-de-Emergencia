'use client';

import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Hook personalizado que expone las funcionalidades de autenticación.
 */
export function useAuth() {
  const {
    usuario,
    cargando,
    isLoading,
    estaAutenticado,
    isAuthenticated,
    iniciarSesion,
    login,
    cerrarSesion,
    logout,
  } = useAuthContext();

  return {
    usuario,
    cargando,
    isLoading,
    estaAutenticado,
    isAuthenticated,
    iniciarSesion,
    login,
    cerrarSesion,
    logout,
  };
}

export default useAuth;
