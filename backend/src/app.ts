/**
 * Configuración principal de Express Application
 * Define middlewares globales, enrutamiento por módulos y manejo de errores
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import config from './config';
import { errorMiddleware } from './middlewares/error.middleware';

// Rutas de módulos
import authRoutes from './modules/auth/auth.routes';
import emergenciasRoutes from './modules/emergencias/emergencias.routes';
import catalogoRoutes from './modules/catalogo/catalogo.routes';
import unidadesRoutes from './modules/unidades/unidades.routes';
import usuariosRoutes from './modules/usuarios/usuarios.routes';

const app: Application = express();

// Middlewares globales
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Carpeta estática para evidencias multimedia
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

// Healthcheck de la API
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    servicio: 'Plataforma de Gestión de Emergencias API',
    timestamp: new Date().toISOString(),
    entorno: config.nodeEnv,
  });
});

// Montaje de rutas modularizadas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/emergencias', emergenciasRoutes);
app.use('/api/v1/catalogo', catalogoRoutes);
app.use('/api/v1/unidades', unidadesRoutes);
app.use('/api/v1/usuarios', usuariosRoutes);

// Manejo de rutas inexistentes (404)
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    exito: false,
    mensaje: 'Ruta no encontrada en la API',
  });
});

// Middleware global de errores
app.use(errorMiddleware);

export default app;
