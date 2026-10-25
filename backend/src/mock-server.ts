/**
 * Servidor Mock de Desarrollo y Pruebas SIGEM
 * Provee la API REST (/api/v1) y el servidor Socket.io en tiempo real
 * con almacenamiento en memoria para probar flujos móviles y de despacho
 * de forma inmediata sin necesidad de levantar PostgreSQL.
 */

import http from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] },
});

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Base de datos en memoria para pruebas
let usuarios = [
  {
    id: 1,
    nombre: 'Administrador',
    apellido: 'Central',
    email: 'admin@emergencias.gob',
    password: 'admin123',
    rol: 'ADMIN',
    activo: true,
  },
  {
    id: 2,
    nombre: 'María',
    apellido: 'López',
    email: 'operador1@emergencias.gob',
    password: 'operador123',
    rol: 'OPERADOR',
    activo: true,
  },
  {
    id: 3,
    nombre: 'Ana',
    apellido: 'García',
    email: 'despachador1@emergencias.gob',
    password: 'despachador123',
    rol: 'DESPACHADOR',
    activo: true,
  },
  {
    id: 4,
    nombre: 'Roberto',
    apellido: 'Díaz',
    email: 'campo1@emergencias.gob',
    password: 'campo123',
    rol: 'PERSONAL_CAMPO',
    activo: true,
    unidadId: 1,
  },
  {
    id: 5,
    nombre: 'Ciudadano',
    apellido: 'Demo',
    email: 'ciudadano@correo.com',
    password: 'ciudadano123',
    rol: 'CIUDADANO',
    activo: true,
  },
];

let catalogo = [
  { id: 1, codigo: 'INC', nombre: 'Incendio Estructural', icono: '🔥', prioridad_default: 1 },
  { id: 2, codigo: 'ACC', nombre: 'Accidente de Tránsito', icono: '🚗', prioridad_default: 2 },
  { id: 3, codigo: 'MED', nombre: 'Emergencia Médica', icono: '🚑', prioridad_default: 1 },
  { id: 4, codigo: 'SEG', nombre: 'Seguridad Ciudadana', icono: '🛡️', prioridad_default: 2 },
  { id: 5, codigo: 'OTR', nombre: 'Incidente General', icono: '🚨', prioridad_default: 3 },
];

let unidades = [
  { id: 1, codigo: 'AMB-01', tipo: 'Ambulancia Medicalizada', placa: 'HUC-101', disponible: true },
  { id: 2, codigo: 'BOM-01', tipo: 'Autobomba de Bomberos', placa: 'BOM-001', disponible: true },
  { id: 3, codigo: 'POL-01', tipo: 'Patrulla Policial', placa: 'POL-305', disponible: true },
];

let emergencias: any[] = [
  {
    id: 1,
    descripcion: 'Choque múltiple entre dos vehículos en intersección vial con una persona atrapada.',
    latitud: 10.4124,
    longitud: -75.5372,
    estado: 'ASIGNADO',
    prioridad: 2,
    id_ciudadano: 5,
    id_unidad: 1,
    unidad: unidades[0],
    id_tipo_emergencia: 2,
    tipo_emergencia: catalogo[1],
    notas_despacho: 'Dirigirse con sirenas activas por carril derecho. CAI Manga en apoyo.',
    fecha_creacion: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    fecha_asignacion: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    ciudadano: usuarios[4],
  },
];

let nextId = 2;

// Middleware simple de extracción de usuario del token (o default)
const authMiddleware = (req: Request, _res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      (req as any).usuario = decoded;
    } catch {
      (req as any).usuario = usuarios[4]; // Default ciudadano
    }
  } else {
    (req as any).usuario = usuarios[4];
  }
  next();
};

/* ─── Rutas de Autenticación ─── */

app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = usuarios.find((u) => u.email.toLowerCase() === email?.toLowerCase());

  if (!user || user.password !== password) {
    return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
  }

  const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email, rol: user.rol })).toString('base64');
  return res.json({
    ok: true,
    mensaje: 'Inicio de sesión exitoso',
    datos: {
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol,
        unidadId: (user as any).unidadId || null,
      },
    },
  });
});

app.post('/api/v1/auth/registrar', (req: Request, res: Response) => {
  const { nombre, apellido, email, telefono, password, rol } = req.body;
  const existente = usuarios.find((u) => u.email.toLowerCase() === email?.toLowerCase());

  if (existente) {
    return res.status(409).json({ ok: false, mensaje: 'El correo electrónico ya está registrado' });
  }

  const nuevoUsuario = {
    id: usuarios.length + 1,
    nombre,
    apellido,
    email,
    telefono: telefono || null,
    password,
    rol: rol || 'CIUDADANO',
    activo: true,
  };
  usuarios.push(nuevoUsuario);

  const token = Buffer.from(JSON.stringify({ id: nuevoUsuario.id, email: nuevoUsuario.email, rol: nuevoUsuario.rol })).toString('base64');

  return res.status(201).json({
    ok: true,
    mensaje: 'Usuario registrado exitosamente',
    datos: {
      token,
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        apellido: nuevoUsuario.apellido,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
      },
    },
  });
});

/* ─── Rutas de Emergencias ─── */

// Healthcheck
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', servicio: 'SIGEM Mock Dev Server', timestamp: new Date().toISOString() });
});

// Listar mis reportes (Ciudadano)
app.get('/api/v1/emergencias/mis-reportes', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).usuario?.id;
  const misReportes = emergencias.filter((e) => e.id_ciudadano === userId);
  return res.json({ ok: true, datos: misReportes });
});

// Listar todas las emergencias
app.get('/api/v1/emergencias', authMiddleware, (req: Request, res: Response) => {
  return res.json({
    ok: true,
    datos: {
      emergencias,
      paginacion: { total: emergencias.length, pagina: 1, limite: 50, total_paginas: 1 },
    },
  });
});

// Detalle de emergencia
app.get('/api/v1/emergencias/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const em = emergencias.find((e) => e.id === id);
  if (!em) {
    return res.status(404).json({ ok: false, mensaje: 'Emergencia no encontrada' });
  }
  return res.json({ ok: true, datos: em });
});

// Crear emergencia (Ciudadano RF-01)
app.post('/api/v1/emergencias', authMiddleware, (req: Request, res: Response) => {
  const { descripcion, latitud, longitud, evidencia_url } = req.body;
  const user = (req as any).usuario;

  const nueva: any = {
    id: nextId++,
    descripcion,
    latitud,
    longitud,
    evidencia_url: evidencia_url || null,
    estado: 'REPORTADO',
    prioridad: 3,
    id_ciudadano: user?.id || 5,
    ciudadano: usuarios.find((u) => u.id === (user?.id || 5)),
    fecha_creacion: new Date().toISOString(),
    tipo_emergencia: catalogo[4],
  };

  emergencias.unshift(nueva);

  // Emitir alerta en tiempo real a operadores y dashboard
  io.emit('sos:alert', nueva);
  console.log(`📡 [Mock Server] Emitido 'sos:alert' para Caso #${nueva.id}: ${nueva.descripcion.substring(0, 40)}`);

  return res.status(201).json({
    ok: true,
    mensaje: 'Emergencia reportada exitosamente',
    datos: nueva,
  });
});

// Iniciar atención (Personal en Campo)
app.patch('/api/v1/emergencias/:id/iniciar-atencion', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const em = emergencias.find((e) => e.id === id);
  if (!em) {
    return res.status(404).json({ ok: false, mensaje: 'Emergencia no encontrada' });
  }

  em.estado = 'EN_ATENCION';
  em.notas_atencion = req.body.notas_atencion || 'Unidad arribó a la escena.';
  em.fecha_inicio_atencion = new Date().toISOString();

  io.emit('case:update', em);
  console.log(`📡 [Mock Server] Emitido 'case:update' (EN_ATENCION) para Caso #${em.id}`);

  return res.json({ ok: true, mensaje: 'Atención iniciada', datos: em });
});

// Cerrar emergencia (Personal en Campo / Operador)
app.patch('/api/v1/emergencias/:id/cerrar', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const em = emergencias.find((e) => e.id === id);
  if (!em) {
    return res.status(404).json({ ok: false, mensaje: 'Emergencia no encontrada' });
  }

  em.estado = 'CERRADO';
  em.resolucion = req.body.resolucion;
  em.fecha_cierre = new Date().toISOString();

  io.emit('case:update', em);
  console.log(`📡 [Mock Server] Emitido 'case:update' (CERRADO) para Caso #${em.id}`);

  return res.json({ ok: true, mensaje: 'Emergencia cerrada exitosamente', datos: em });
});

// Asignar unidad (Despacho RF-05) - Dispara notificación de despacho en tiempo real a la unidad
app.patch('/api/v1/emergencias/:id/asignar', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const em = emergencias.find((e) => e.id === id);
  if (!em) {
    return res.status(404).json({ ok: false, mensaje: 'Emergencia no encontrada' });
  }

  em.estado = 'ASIGNADO';
  em.id_unidad = req.body.id_unidad || 1;
  em.unidad = unidades.find((u) => u.id === em.id_unidad) || unidades[0];
  em.notas_despacho = req.body.notas_despacho || 'Despacho prioritario asignado a la unidad.';
  em.fecha_asignacion = new Date().toISOString();

  // EMITIR ACTUALIZACIÓN: Esto disparará la vibración y alerta en el teléfono del personal de campo
  io.emit('case:update', em);
  console.log(`🚨 [Mock Server] ¡DISPARO DE DESPACHO! Emitido 'case:update' (ASIGNADO) para Caso #${em.id} a Unidad ${em.unidad.codigo}`);

  return res.json({ ok: true, mensaje: 'Unidad asignada exitosamente', datos: em });
});

/* ─── WebSocket Eventos ─── */

io.on('connection', (socket) => {
  console.log(`🟢 [Mock Socket] Cliente conectado: ${socket.id}`);

  socket.on('gps:update', (data) => {
    io.emit('gps:update', data);
    console.log(`📍 [Mock Socket] Posición GPS recibida de Unidad:`, data);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 [Mock Socket] Cliente desconectado: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 [SIGEM Mock Server] Activo en: http://localhost:${PORT}`);
  console.log(`📡 WebSocket y API REST listos para pruebas en: http://localhost:${PORT}/api/v1`);
});
