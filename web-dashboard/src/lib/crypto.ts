/**
 * Utilidades criptográficas para verificación de integridad
 * en la cadena de custodia de registros de auditoría (RNF-09).
 * Utiliza Web Crypto API nativa del navegador (W3C standard).
 */

/** Genera un hash SHA-256 truncado (primeros 16 caracteres hexadecimales) */
export async function hashSHA256Short(data: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Fallback simple para entornos SSR
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

/** Genera la huella digital criptográfica inmutable para un registro de auditoría */
export async function generarHuellaAuditoria(registro: {
  id: number;
  id_emergencia: number;
  id_usuario_accion: number;
  fecha: string | Date;
  accion_realizada: string;
  estado_anterior?: string | null;
  estado_nuevo?: string | null;
}): Promise<string> {
  const cadena = `${registro.id}|${registro.id_emergencia}|${registro.id_usuario_accion}|${
    typeof registro.fecha === 'string' ? registro.fecha : registro.fecha.toISOString()
  }|${registro.accion_realizada}|${registro.estado_anterior || ''}|${registro.estado_nuevo || ''}`;
  return hashSHA256Short(cadena);
}
