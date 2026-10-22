/**
 * Servidor HTTP principal
 * Inicializa el backend Express y verifica conexión con PostgreSQL vía Prisma
 */

import app from './app';
import config from './config';
import prisma from './lib/prisma';

async function bootstrap() {
  try {
    // Probar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conexión establecida con la Base de Datos Única (PostgreSQL/Prisma)');

    app.listen(config.port, () => {
      console.log(`🚀 API de Gestión de Emergencias activa en: http://localhost:${config.port}`);
      console.log(`📡 Rutas disponibles bajo prefijo: http://localhost:${config.port}/api/v1`);
      console.log(`🩺 Health check: http://localhost:${config.port}/api/v1/health`);
    });
  } catch (error) {
    console.error('❌ Error crítico al iniciar el servidor:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
