/**
 * Servidor HTTP principal
 * Inicializa Express y Socket.io, y verifica conexión con PostgreSQL vía Prisma
 */
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import config from './config';
import prisma from './lib/prisma';

// Crear servidor HTTP y Socket.io
const httpServer = http.createServer(app);
export const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

async function bootstrap() {
  try {
    // Probar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conexión establecida con la Base de Datos (PostgreSQL/Prisma)');

    httpServer.listen(config.port, () => {
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