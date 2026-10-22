'use client';

import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Hook personalizado que expone las funcionalidades de autenticación.
 * Es un wrapper simple sobre useAuthContext para una API más limpia.
 */
export function useAuth() {
  const {
    usuario,
    cargando,
    estaAutenticado,
    iniciarSesion,
    cerrarSesion,
  } = useAuthContext();

  return {
    usuario,
    cargando,
    estaAutenticado,
    iniciarSesion,
    cerrarSesion,
  };
}
