/**
 * Seed de la base de datos para la Plataforma de Gestión de Emergencias
 * Crea datos iniciales: admin, operadores, despachador, catálogo y unidades
 */

import { PrismaClient, RolUsuario, EstadoUnidad } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Número de rondas para el hash de contraseñas
  const SALT_ROUNDS = 10;

  // =============================================
  // 1. CREAR USUARIOS DEL SISTEMA
  // =============================================

  // Administrador principal
  const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@emergencias.gob' },
    update: {},
    create: {
      nombre: 'Administrador',
      apellido: 'Sistema',
      email: 'admin@emergencias.gob',
      telefono: '+505 8888-0001',
      password_hash: adminPassword,
      rol: RolUsuario.ADMIN,
      activo: true,
    },
  });
  console.log(`✅ Admin creado: ${admin.email}`);

  // Operador 1 - Recibe y clasifica reportes
  const operadorPassword = await bcrypt.hash('operador123', SALT_ROUNDS);
  const operador1 = await prisma.usuario.upsert({
    where: { email: 'operador1@emergencias.gob' },
    update: {},
    create: {
      nombre: 'María',
      apellido: 'López Hernández',
      email: 'operador1@emergencias.gob',
      telefono: '+505 8888-0002',
      password_hash: operadorPassword,
      rol: RolUsuario.OPERADOR,
      activo: true,
    },
  });
  console.log(`✅ Operador 1 creado: ${operador1.email}`);

  // Operador 2
  const operador2 = await prisma.usuario.upsert({
    where: { email: 'operador2@emergencias.gob' },
    update: {},
    create: {
      nombre: 'Carlos',
      apellido: 'Martínez Ruiz',
      email: 'operador2@emergencias.gob',
      telefono: '+505 8888-0003',
      password_hash: operadorPassword,
      rol: RolUsuario.OPERADOR,
      activo: true,
    },
  });
  console.log(`✅ Operador 2 creado: ${operador2.email}`);

  // Despachador - Asigna unidades a las emergencias
  const despachadorPassword = await bcrypt.hash('despachador123', SALT_ROUNDS);
  const despachador = await prisma.usuario.upsert({
    where: { email: 'despachador1@emergencias.gob' },
    update: {},
    create: {
      nombre: 'Ana',
      apellido: 'García Morales',
      email: 'despachador1@emergencias.gob',
      telefono: '+505 8888-0004',
      password_hash: despachadorPassword,
      rol: RolUsuario.DESPACHADOR,
      activo: true,
    },
  });
  console.log(`✅ Despachador creado: ${despachador.email}`);

  // Personal de campo
  const campoPassword = await bcrypt.hash('campo123', SALT_ROUNDS);
  const personalCampo = await prisma.usuario.upsert({
    where: { email: 'campo1@emergencias.gob' },
    update: {},
    create: {
      nombre: 'Roberto',
      apellido: 'Díaz Flores',
      email: 'campo1@emergencias.gob',
      telefono: '+505 8888-0005',
      password_hash: campoPassword,
      rol: RolUsuario.PERSONAL_CAMPO,
      activo: true,
    },
  });
  console.log(`✅ Personal de campo creado: ${personalCampo.email}`);

  // =============================================
  // 2. CATÁLOGO DE TIPOS DE EMERGENCIA (RF-09)
  // =============================================

  const tiposEmergencia = [
    {
      codigo: 'INC',
      nombre: 'Incendio',
      descripcion: 'Incendio forestal, estructural o vehicular',
      prioridad_default: 1,
      icono: '🔥',
    },
    {
      codigo: 'ACC-TRAN',
      nombre: 'Accidente de Tránsito',
      descripcion: 'Colisiones vehiculares, atropellos y volcaduras',
      prioridad_default: 2,
      icono: '🚗',
    },
    {
      codigo: 'EME-MED',
      nombre: 'Emergencia Médica',
      descripcion: 'Situaciones que requieren atención médica urgente',
      prioridad_default: 1,
      icono: '🏥',
    },
    {
      codigo: 'INUND',
      nombre: 'Inundación',
      descripcion: 'Inundaciones por lluvias, desbordamientos o mareas',
      prioridad_default: 2,
      icono: '🌊',
    },
    {
      codigo: 'DERR',
      nombre: 'Derrumbe',
      descripcion: 'Deslizamientos de tierra, derrumbes de estructuras',
      prioridad_default: 1,
      icono: '🏚️',
    },
    {
      codigo: 'ROB',
      nombre: 'Robo/Asalto',
      descripcion: 'Robos a mano armada, asaltos y hurtos',
      prioridad_default: 2,
      icono: '🚨',
    },
    {
      codigo: 'VIOL-DOM',
      nombre: 'Violencia Doméstica',
      descripcion: 'Casos de violencia intrafamiliar y doméstica',
      prioridad_default: 2,
      icono: '🏠',
    },
    {
      codigo: 'FUGA-GAS',
      nombre: 'Fuga de Gas',
      descripcion: 'Fugas de gas natural, propano u otros combustibles',
      prioridad_default: 1,
      icono: '💨',
    },
  ];

  for (const tipo of tiposEmergencia) {
    await prisma.catalogoTipoEmergencia.upsert({
      where: { codigo: tipo.codigo },
      update: {},
      create: tipo,
    });
  }
  console.log(`✅ ${tiposEmergencia.length} tipos de emergencia creados`);

  // =============================================
  // 3. UNIDADES DE RESPUESTA
  // =============================================

  const unidades = [
    {
      codigo: 'AMB-001',
      tipo: 'Ambulancia',
      placa: 'M-001-AMB',
      estado: EstadoUnidad.DISPONIBLE,
      latitud_actual: 12.1364,
      longitud_actual: -86.2514,
    },
    {
      codigo: 'BOM-001',
      tipo: 'Bomba',
      placa: 'M-001-BOM',
      estado: EstadoUnidad.DISPONIBLE,
      latitud_actual: 12.1150,
      longitud_actual: -86.2362,
    },
    {
      codigo: 'PAT-001',
      tipo: 'Patrulla',
      placa: 'M-001-PAT',
      estado: EstadoUnidad.DISPONIBLE,
      latitud_actual: 12.1290,
      longitud_actual: -86.2680,
    },
  ];

  for (const unidad of unidades) {
    await prisma.unidad.upsert({
      where: { codigo: unidad.codigo },
      update: {},
      create: unidad,
    });
  }
  console.log(`✅ ${unidades.length} unidades de respuesta creadas`);

  console.log('\n🎉 Seed completado exitosamente');
}

main()
  .catch((error) => {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
