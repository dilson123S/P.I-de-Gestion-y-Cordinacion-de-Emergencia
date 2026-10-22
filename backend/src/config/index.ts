/**
 * Configuración centralizada de la aplicación
 * Carga variables de entorno con dotenv y exporta un objeto tipado
 */

import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

/** Objeto de configuración global de la aplicación */
export const config = {
  /** Puerto del servidor HTTP */
  port: parseInt(process.env.PORT || '3001', 10),

  /** Secreto para firmar y verificar tokens JWT */
  jwtSecret: process.env.JWT_SECRET || 'secreto_por_defecto_cambiar_en_produccion',

  /** Entorno de ejecución: development | production | test */
  nodeEnv: process.env.NODE_ENV || 'development',

  /** Directorio para archivos subidos (evidencias) */
  uploadDir: process.env.UPLOAD_DIR || './uploads',

  /** URL de conexión a la base de datos (usada por Prisma directamente) */
  databaseUrl: process.env.DATABASE_URL || '',

  /** Tiempo de expiración de tokens JWT */
  jwtExpiresIn: '24h',
} as const;
