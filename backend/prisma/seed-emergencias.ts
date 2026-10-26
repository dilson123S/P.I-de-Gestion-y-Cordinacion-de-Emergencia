import { PrismaClient, RolUsuario, EstadoEmergencia, EstadoUnidad } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚑 Generando emergencias demo para visualización en el dashboard...');

  const pass = await bcrypt.hash('ciudadano123', 10);
  const ciudadano = await prisma.usuario.upsert({
    where: { email: 'ciudadano@correo.com' },
    update: {},
    create: {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'ciudadano@correo.com',
      telefono: '+57 310 555 1234',
      password_hash: pass,
      rol: RolUsuario.CIUDADANO,
      activo: true,
    },
  });

  const operador = await prisma.usuario.findUnique({ where: { email: 'operador1@emergencias.gob' } });
  const despachador = await prisma.usuario.findUnique({ where: { email: 'despachador1@emergencias.gob' } });
  const amb = await prisma.unidad.findUnique({ where: { codigo: 'AMB-01' } });
  const bom = await prisma.unidad.findUnique({ where: { codigo: 'BOM-01' } });
  const pol = await prisma.unidad.findUnique({ where: { codigo: 'PAT-01' } });

  const inc = await prisma.catalogoTipoEmergencia.findUnique({ where: { codigo: 'INC' } });
  const acc = await prisma.catalogoTipoEmergencia.findUnique({ where: { codigo: 'ACC-TRAN' } });
  const med = await prisma.catalogoTipoEmergencia.findUnique({ where: { codigo: 'EME-MED' } });
  const inu = await prisma.catalogoTipoEmergencia.findUnique({ where: { codigo: 'INUND' } });
  const seg = await prisma.catalogoTipoEmergencia.findUnique({ where: { codigo: 'ROB' } });

  // 1. REPORTADO
  const e1 = await prisma.emergencia.create({
    data: {
      descripcion: 'Humo denso y llamas saliendo del 3er piso de un edificio comercial en Bocagrande.',
      latitud: 10.4025,
      longitud: -75.5539,
      estado: EstadoEmergencia.REPORTADO,
      prioridad: 1,
      id_ciudadano: ciudadano.id,
      id_tipo_emergencia: inc?.id,
    },
  });

  // 2. CLASIFICADO
  const e2 = await prisma.emergencia.create({
    data: {
      descripcion: 'Colisión múltiple entre taxi y autobús con dos personas policontundidas en Av. Pedro de Heredia.',
      latitud: 10.4189,
      longitud: -75.5267,
      estado: EstadoEmergencia.CLASIFICADO,
      prioridad: 2,
      id_ciudadano: ciudadano.id,
      id_operador: operador?.id,
      id_tipo_emergencia: acc?.id,
      notas_clasificacion: 'Confirmado por cámaras del distrito. Se requiere ambulancia y policía de tránsito.',
      fecha_clasificacion: new Date(),
    },
  });

  // 3. ASIGNADO
  const e3 = await prisma.emergencia.create({
    data: {
      descripcion: 'Persona de la tercera edad con dolor torácico agudo y dificultad respiratoria en Centro Histórico.',
      latitud: 10.4236,
      longitud: -75.5492,
      estado: EstadoEmergencia.ASIGNADO,
      prioridad: 1,
      id_ciudadano: ciudadano.id,
      id_operador: operador?.id,
      id_despachador: despachador?.id,
      id_unidad: amb?.id,
      id_tipo_emergencia: med?.id,
      notas_clasificacion: 'Paciente con antecedentes cardíacos, prioridad alta.',
      fecha_clasificacion: new Date(Date.now() - 15 * 60 * 1000),
      notas_despacho: 'Despachada ambulancia medicalizada AMB-01. Tiempo estimado de arribo: 6 minutos.',
      fecha_asignacion: new Date(Date.now() - 10 * 60 * 1000),
    },
  });

  // 4. EN_ATENCION
  const e4 = await prisma.emergencia.create({
    data: {
      descripcion: 'Inundación severa por marea alta y lluvias en el sector El Laguito, afectando acceso vehicular.',
      latitud: 10.3951,
      longitud: -75.5583,
      estado: EstadoEmergencia.EN_ATENCION,
      prioridad: 2,
      id_ciudadano: ciudadano.id,
      id_operador: operador?.id,
      id_despachador: despachador?.id,
      id_unidad: bom?.id,
      id_tipo_emergencia: inu?.id,
      notas_clasificacion: 'Riesgo de ingreso de agua a parqueaderos subterráneos.',
      fecha_clasificacion: new Date(Date.now() - 40 * 60 * 1000),
      notas_despacho: 'Unidad de bomberos enviada con motobombas de achique.',
      fecha_asignacion: new Date(Date.now() - 35 * 60 * 1000),
      notas_atencion: 'Personal en sitio operando equipos de drenaje y coordinando tráfico.',
      fecha_inicio_atencion: new Date(Date.now() - 20 * 60 * 1000),
    },
  });

  // 5. CERRADO
  const e5 = await prisma.emergencia.create({
    data: {
      descripcion: 'Intento de hurto frustrado a turistas en la Plaza de la Trinidad, Getsemaní.',
      latitud: 10.4195,
      longitud: -75.5448,
      estado: EstadoEmergencia.CERRADO,
      prioridad: 3,
      id_ciudadano: ciudadano.id,
      id_operador: operador?.id,
      id_despachador: despachador?.id,
      id_unidad: pol?.id,
      id_tipo_emergencia: seg?.id,
      notas_clasificacion: 'Patrulla del cuadrante más cercana notificada.',
      fecha_clasificacion: new Date(Date.now() - 120 * 60 * 1000),
      notas_despacho: 'Patrulla PAT-01 asignada.',
      fecha_asignacion: new Date(Date.now() - 110 * 60 * 1000),
      notas_atencion: 'Sujeto interceptado, pertenencias recuperadas y entregadas a los afectados.',
      fecha_inicio_atencion: new Date(Date.now() - 95 * 60 * 1000),
      resolucion: 'Procedimiento policial completado. Sospechoso puesto a disposición de la Fiscalía.',
      fecha_cierre: new Date(Date.now() - 30 * 60 * 1000),
    },
  });

  if (amb) await prisma.unidad.update({ where: { id: amb.id }, data: { estado: EstadoUnidad.DESPACHADA } });
  if (bom) await prisma.unidad.update({ where: { id: bom.id }, data: { estado: EstadoUnidad.EN_ESCENA } });

  console.log('✅ 5 emergencias demo creadas en diferentes estados del ciclo de vida.');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
