/**
 * Seed de la base de datos para la Plataforma de Gestión de Emergencias
 * Ubicación y contexto: Cartagena de Indias, Bolívar, Colombia
 * Crea datos iniciales: admin, operadores, despachador, catálogo y unidades
 */

import { PrismaClient, RolUsuario, EstadoUnidad } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos para Cartagena de Indias...');

  const SALT_ROUNDS = 10;

  // =============================================
  // 1. CREAR USUARIOS DEL SISTEMA (CARTAGENA)
  // =============================================

  const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@emergencias.gob' },
    update: {},
    create: {
      nombre: 'Administrador',
      apellido: 'Central Cartagena',
      email: 'admin@emergencias.gob',
      telefono: '+57 300 888 0001',
      password_hash: adminPassword,
      rol: RolUsuario.ADMIN,
      activo: true,
    },
  });
  console.log(`✅ Admin creado: ${admin.email}`);

  const operadorPassword = await bcrypt.hash('operador123', SALT_ROUNDS);
  const operador1 = await prisma.usuario.upsert({
    where: { email: 'operador1@emergencias.gob' },
    update: {},
    create: {
      nombre: 'María',
      apellido: 'López Hernández',
      email: 'operador1@emergencias.gob',
      telefono: '+57 300 888 0002',
      password_hash: operadorPassword,
      rol: RolUsuario.OPERADOR,
      activo: true,
    },
  });
  console.log(`✅ Operador 1 creado: ${operador1.email}`);

  const operador2 = await prisma.usuario.upsert({
    where: { email: 'operador2@emergencias.gob' },
    update: {},
    create: {
      nombre: 'Carlos',
      apellido: 'Martínez Ruiz',
      email: 'operador2@emergencias.gob',
      telefono: '+57 300 888 0003',
      password_hash: operadorPassword,
      rol: RolUsuario.OPERADOR,
      activo: true,
    },
  });
  console.log(`✅ Operador 2 creado: ${operador2.email}`);

  const despachadorPassword = await bcrypt.hash('despachador123', SALT_ROUNDS);
  const despachador = await prisma.usuario.upsert({
    where: { email: 'despachador1@emergencias.gob' },
    update: {},
    create: {
      nombre: 'Ana',
      apellido: 'García Morales',
      email: 'despachador1@emergencias.gob',
      telefono: '+57 300 888 0004',
      password_hash: despachadorPassword,
      rol: RolUsuario.DESPACHADOR,
      activo: true,
    },
  });
  console.log(`✅ Despachador creado: ${despachador.email}`);

  const campoPassword = await bcrypt.hash('campo123', SALT_ROUNDS);
  const personalCampo = await prisma.usuario.upsert({
    where: { email: 'campo1@emergencias.gob' },
    update: {},
    create: {
      nombre: 'Roberto',
      apellido: 'Díaz Flores',
      email: 'campo1@emergencias.gob',
      telefono: '+57 300 888 0005',
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
      nombre: 'Incendio Estructural / Forestal',
      descripcion: 'Incendio en vivienda, industria o zona de vegetación',
      prioridad_default: 1,
      icono: '🔥',
    },
    {
      codigo: 'ACC-TRAN',
      nombre: 'Accidente de Tránsito',
      descripcion: 'Colisiones vehiculares en vías principales de Cartagena',
      prioridad_default: 2,
      icono: '🚗',
    },
    {
      codigo: 'EME-MED',
      nombre: 'Emergencia Médica / Triage',
      descripcion: 'Situaciones de salud aguda que requieren traslado medicalizado',
      prioridad_default: 1,
      icono: '🏥',
    },
    {
      codigo: 'INUND',
      nombre: 'Inundación / Alerta Costera',
      descripcion: 'Inundaciones por lluvias, marea de leva o desbordamiento de canales',
      prioridad_default: 2,
      icono: '🌊',
    },
    {
      codigo: 'DERR',
      nombre: 'Derrumbe / Colapso',
      descripcion: 'Deslizamiento en La Popa o colapso de infraestructura histórica',
      prioridad_default: 1,
      icono: '🏚️',
    },
    {
      codigo: 'ROB',
      nombre: 'Seguridad Ciudadana / Hurto',
      descripcion: 'Requerimientos de intervención policial inmediata',
      prioridad_default: 2,
      icono: '🚨',
    },
    {
      codigo: 'VIOL-DOM',
      nombre: 'Violencia Intrafamiliar',
      descripcion: 'Casos de violencia de género y protección de menores',
      prioridad_default: 2,
      icono: '🏠',
    },
    {
      codigo: 'FUGA-GAS',
      nombre: 'Fuga de Gas / Químicos',
      descripcion: 'Fugas de GLP o químicos en zona turística, comercial o industrial',
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
  // 3. UNIDADES DE RESPUESTA EN CARTAGENA
  // =============================================

  const unidades = [
    {
      codigo: 'AMB-01',
      tipo: 'Ambulancia TAB - Hospital Universitario del Caribe',
      placa: 'HUC-101',
      estado: EstadoUnidad.DISPONIBLE,
      latitud_actual: 10.4165,
      longitud_actual: -75.5122, // Zaragocilla
    },
    {
      codigo: 'BOM-01',
      tipo: 'Autobomba Cuerpo de Bomberos - Estación Santa Lucía',
      placa: 'BOM-001',
      estado: EstadoUnidad.DISPONIBLE,
      latitud_actual: 10.4182,
      longitud_actual: -75.5325, // Santa Lucía
    },
    {
      codigo: 'PAT-01',
      tipo: 'Patrulla Policía Metropolitana - CAI Manga',
      placa: 'POL-305',
      estado: EstadoUnidad.DISPONIBLE,
      latitud_actual: 10.4124,
      longitud_actual: -75.5372, // Manga
    },
  ];

  for (const unidad of unidades) {
    await prisma.unidad.upsert({
      where: { codigo: unidad.codigo },
      update: {},
      create: unidad,
    });
  }
  console.log(`✅ ${unidades.length} unidades de respuesta creadas para Cartagena`);

  console.log('\n🎉 Seed completado exitosamente para Cartagena de Indias, Colombia');
}

main()
  .catch((error) => {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
