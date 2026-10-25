/**
 * Script de prueba de integración de flujo completo SIGEM (usa native fetch):
 * 1. Login de Ciudadano y Personal de Campo
 * 2. Conexión WebSocket en tiempo real
 * 3. Creación de Reporte SOS (RF-01)
 * 4. Asignación de Despacho en tiempo real (RF-05) con recepción en la app
 * 5. Inicio de atención en escena y cierre de caso
 */

import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3001/api/v1';
const SOCKET_URL = 'http://localhost:3001';

async function postJson(url: string, body: any, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return (await res.json()) as any;
}

async function patchJson(url: string, body: any, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return (await res.json()) as any;
}

async function ejecutarPrueba() {
  console.log('🧪 ===================================================');
  console.log('🧪 INICIANDO PRUEBA DE FLUJO MÓVIL Y DESPACHO EN VIVO');
  console.log('🧪 ===================================================\n');

  // 1. Healthcheck
  const healthRes = await (await fetch(`${API_URL}/health`)).json();
  console.log('1️⃣ [Healthcheck]:', healthRes);

  // 2. Iniciar sesión como Ciudadano
  console.log('\n2️⃣ [Login Ciudadano] Autenticando ciudadano@correo.com...');
  const loginCiudadanoRes = await postJson(`${API_URL}/auth/login`, {
    email: 'ciudadano@correo.com',
    password: 'ciudadano123',
  });
  console.log('✅ Login exitoso:', loginCiudadanoRes.mensaje);
  const tokenCiudadano = loginCiudadanoRes.datos.token;
  const usuarioCiudadano = loginCiudadanoRes.datos.usuario;
  console.log(`   👤 Ciudadano: ${usuarioCiudadano.nombre} (ID: ${usuarioCiudadano.id})`);

  // 3. Iniciar sesión como Personal de Campo
  console.log('\n3️⃣ [Login Campo] Autenticando campo1@emergencias.gob...');
  const loginCampoRes = await postJson(`${API_URL}/auth/login`, {
    email: 'campo1@emergencias.gob',
    password: 'campo123',
  });
  console.log('✅ Login exitoso:', loginCampoRes.mensaje);
  const tokenCampo = loginCampoRes.datos.token;
  const usuarioCampo = loginCampoRes.datos.usuario;
  console.log(`   🚒 Personal Campo: ${usuarioCampo.nombre} (Unidad ID: ${usuarioCampo.unidadId})`);

  // 4. Conectar cliente móvil de Personal de Campo a WebSocket
  console.log('\n4️⃣ [WebSocket] Conectando socket móvil de Personal de Campo...');
  const socketCampo = io(SOCKET_URL, {
    auth: { token: tokenCampo },
    transports: ['websocket'],
  });

  const esperaDespacho = new Promise<any>((resolve) => {
    socketCampo.on('connect', () => {
      console.log('   🟢 [Socket Campo] Conectado exitosamente en tiempo real');
    });

    socketCampo.on('sos:alert', (alerta) => {
      console.log(`   📡 [Socket Campo] ¡Alerta SOS detectada en la red! Caso #${alerta.id}`);
    });

    socketCampo.on('case:update', (caso) => {
      if (caso.estado === 'ASIGNADO') {
        console.log(`   🚨🚨🚨 [NOTIFICACIÓN DE DESPACHO RECIBIDA EN APP MÓVIL] 🚨🚨🚨`);
        console.log(`   Caso #${caso.id}: ${caso.descripcion}`);
        console.log(`   Unidad Despachada: ${caso.unidad?.tipo} (${caso.unidad?.codigo})`);
        console.log(`   Instrucciones: ${caso.notas_despacho}`);
        resolve(caso);
      }
    });
  });

  // Esperar 600ms para asegurar conexión del socket
  await new Promise((r) => setTimeout(r, 600));

  // 5. Ciudadano reporta emergencia SOS
  console.log('\n5️⃣ [Reportar SOS] Enviando reporte de emergencia desde la app ciudadana...');
  const nuevoReporteRes = await postJson(
    `${API_URL}/emergencias`,
    {
      descripcion: 'Incendio en vivienda de dos pisos, humo denso saliendo del segundo nivel.',
      latitud: 10.4215,
      longitud: -75.5412,
      evidencia_url: 'https://images.unsplash.com/photo-1542385151-efd9000785a0',
    },
    tokenCiudadano
  );
  const emergenciaCreada = nuevoReporteRes.datos;
  console.log(`✅ Emergencia reportada exitosamente: Caso #${emergenciaCreada.id} (Estado: ${emergenciaCreada.estado})`);

  // 6. Despachador asigna la unidad a la emergencia creada (RF-05)
  console.log(`\n6️⃣ [Despacho RF-05] Despachador asigna Unidad #1 al Caso #${emergenciaCreada.id}...`);
  await patchJson(`${API_URL}/emergencias/${emergenciaCreada.id}/asignar`, {
    id_unidad: 1,
    notas_despacho: 'Prioridad 1. Desplazarse con sirenas activas por Av. Pedro de Heredia.',
  });

  // Esperar a que el socket del móvil reciba el despacho
  const despachoRecibido = await esperaDespacho;
  console.log('✅ Verificado: La app móvil capturó la alerta de despacho en tiempo real.');

  // 7. Personal de campo confirma llegada a la escena
  console.log('\n7️⃣ [En Escena] Personal de campo pulsa "Confirmar Llegada"...');
  const atencionRes = await patchJson(
    `${API_URL}/emergencias/${despachoRecibido.id}/iniciar-atencion`,
    {
      notas_atencion: 'Unidad arribó a las 13:25. Se inicia tendido de mangueras y control del fuego.',
    }
  );
  console.log(`✅ Estado actualizado: ${atencionRes.datos.estado} - ${atencionRes.datos.notas_atencion}`);

  // 8. Personal de campo cierra la misión con resolución final
  console.log('\n8️⃣ [Cierre de Misión] Personal de campo registra resolución y libera unidad...');
  const cierreRes = await patchJson(`${API_URL}/emergencias/${despachoRecibido.id}/cerrar`, {
    resolucion: 'Fuego extinguido en su totalidad. Sin personas lesionadas. Inmueble asegurado.',
  });
  console.log(`✅ Emergencia CERRADA: ${cierreRes.datos.resolucion}`);

  socketCampo.disconnect();
  console.log('\n🎉 ===================================================');
  console.log('🎉 PRUEBA DE FLUJO COMPLETO FINALIZADA CON ÉXITO 100%');
  console.log('🎉 ===================================================');
}

ejecutarPrueba().catch((err) => {
  console.error('❌ Error en la prueba:', err);
  process.exit(1);
});
