/**
 * Servicio de Emergencias — NÚCLEO DEL SISTEMA
 *
 * Implementa las transiciones de estado del ciclo de vida de una emergencia:
 *   REPORTADO → CLASIFICADO → ASIGNADO → EN_ATENCION → CERRADO
 *
 * Cada transición:
 *   1. Valida el estado actual antes de transicionar
 *   2. Usa transacciones Prisma ($transaction) para atomicidad
 *   3. Crea un registro en LogAuditoria (RNF-09)
 *
 * Principio RNF-07: Registro único de datos — la información capturada
 * en el reporte inicial está disponible automáticamente en todas las etapas.
 */

import { EstadoEmergencia, EstadoUnidad, Prisma } from '@prisma/client';
import prisma from '../../lib/prisma';
import {
  CrearEmergenciaInput,
  ClasificarReporteInput,
  AsignarUnidadInput,
  IniciarAtencionInput,
  CerrarEmergenciaInput,
} from './emergencias.schemas';

/** Error con código de estado HTTP */
function httpError(mensaje: string, statusCode: number): Error {
  return Object.assign(new Error(mensaje), { statusCode });
}

/** Relaciones completas que se incluyen al consultar una emergencia */
const INCLUDE_COMPLETO = {
  ciudadano: {
    select: { id: true, nombre: true, apellido: true, email: true, telefono: true, rol: true },
  },
  operador: {
    select: { id: true, nombre: true, apellido: true, email: true, rol: true },
  },
  despachador: {
    select: { id: true, nombre: true, apellido: true, email: true, rol: true },
  },
  unidad: true,
  tipo_emergencia: true,
} satisfies Prisma.EmergenciaInclude;

export class EmergenciasService {
  // =================================================================
  // 1. CREAR REPORTE (RF-01) — Estado inicial: REPORTADO
  // =================================================================
  async crearReporte(data: CrearEmergenciaInput, idCiudadano: number) {
    return prisma.$transaction(async (tx) => {
      // Crear la emergencia con estado REPORTADO
      const emergencia = await tx.emergencia.create({
        data: {
          descripcion: data.descripcion,
          latitud: data.latitud,
          longitud: data.longitud,
          evidencia_url: data.evidencia_url,
          estado: EstadoEmergencia.REPORTADO,
          id_ciudadano: idCiudadano,
        },
        include: INCLUDE_COMPLETO,
      });

      // Registrar en auditoría (RNF-09)
      await tx.logAuditoria.create({
        data: {
          id_emergencia: emergencia.id,
          id_usuario_accion: idCiudadano,
          accion_realizada: 'Reporte creado por ciudadano',
          estado_anterior: null,
          estado_nuevo: EstadoEmergencia.REPORTADO,
          datos_modificados: {
            descripcion: data.descripcion,
            latitud: data.latitud,
            longitud: data.longitud,
            evidencia_url: data.evidencia_url,
          },
        },
      });

      return emergencia;
    });
  }

  // =================================================================
  // 2. CLASIFICAR REPORTE (RF-03) — REPORTADO → CLASIFICADO
  // =================================================================
  async clasificarReporte(idEmergencia: number, data: ClasificarReporteInput, idOperador: number) {
    return prisma.$transaction(async (tx) => {
      // Obtener emergencia actual y validar estado
      const emergencia = await tx.emergencia.findUnique({
        where: { id: idEmergencia },
      });

      if (!emergencia) {
        throw httpError(`Emergencia con ID ${idEmergencia} no encontrada`, 404);
      }

      if (emergencia.estado !== EstadoEmergencia.REPORTADO) {
        throw httpError(
          `No se puede clasificar: el estado actual es "${emergencia.estado}". Se requiere estado "REPORTADO"`,
          409
        );
      }

      // Verificar que el tipo de emergencia exista en el catálogo
      const tipoEmergencia = await tx.catalogoTipoEmergencia.findUnique({
        where: { id: data.id_tipo_emergencia },
      });

      if (!tipoEmergencia) {
        throw httpError('El tipo de emergencia seleccionado no existe en el catálogo', 400);
      }

      // Transicionar estado: REPORTADO → CLASIFICADO
      const actualizada = await tx.emergencia.update({
        where: { id: idEmergencia },
        data: {
          estado: EstadoEmergencia.CLASIFICADO,
          id_operador: idOperador,
          id_tipo_emergencia: data.id_tipo_emergencia,
          prioridad: data.prioridad,
          notas_clasificacion: data.notas_clasificacion,
          fecha_clasificacion: new Date(),
        },
        include: INCLUDE_COMPLETO,
      });

      // Registrar en auditoría (RNF-09)
      await tx.logAuditoria.create({
        data: {
          id_emergencia: idEmergencia,
          id_usuario_accion: idOperador,
          accion_realizada: 'Clasificación de reporte',
          estado_anterior: EstadoEmergencia.REPORTADO,
          estado_nuevo: EstadoEmergencia.CLASIFICADO,
          datos_modificados: {
            id_tipo_emergencia: data.id_tipo_emergencia,
            tipo_nombre: tipoEmergencia.nombre,
            prioridad: data.prioridad,
            notas_clasificacion: data.notas_clasificacion,
          },
        },
      });

      return actualizada;
    });
  }

  // =================================================================
  // 3. ASIGNAR UNIDAD (RF-05) — CLASIFICADO → ASIGNADO
  // =================================================================
  async asignarUnidad(idEmergencia: number, data: AsignarUnidadInput, idDespachador: number) {
    return prisma.$transaction(async (tx) => {
      const emergencia = await tx.emergencia.findUnique({
        where: { id: idEmergencia },
      });

      if (!emergencia) {
        throw httpError(`Emergencia con ID ${idEmergencia} no encontrada`, 404);
      }

      if (emergencia.estado !== EstadoEmergencia.CLASIFICADO) {
        throw httpError(
          `No se puede asignar unidad: el estado actual es "${emergencia.estado}". Se requiere estado "CLASIFICADO"`,
          409
        );
      }

      // Verificar que la unidad exista y esté disponible
      const unidad = await tx.unidad.findUnique({
        where: { id: data.id_unidad },
      });

      if (!unidad) {
        throw httpError('La unidad seleccionada no existe', 400);
      }

      if (unidad.estado !== EstadoUnidad.DISPONIBLE) {
        throw httpError(
          `La unidad "${unidad.codigo}" no está disponible. Estado actual: "${unidad.estado}"`,
          409
        );
      }

      // Transicionar emergencia: CLASIFICADO → ASIGNADO
      const actualizada = await tx.emergencia.update({
        where: { id: idEmergencia },
        data: {
          estado: EstadoEmergencia.ASIGNADO,
          id_despachador: idDespachador,
          id_unidad: data.id_unidad,
          notas_despacho: data.notas_despacho,
          fecha_asignacion: new Date(),
        },
        include: INCLUDE_COMPLETO,
      });

      // Actualizar estado de la unidad: DISPONIBLE → DESPACHADA
      await tx.unidad.update({
        where: { id: data.id_unidad },
        data: { estado: EstadoUnidad.DESPACHADA },
      });

      // Registrar en auditoría (RNF-09)
      await tx.logAuditoria.create({
        data: {
          id_emergencia: idEmergencia,
          id_usuario_accion: idDespachador,
          accion_realizada: 'Asignación de unidad',
          estado_anterior: EstadoEmergencia.CLASIFICADO,
          estado_nuevo: EstadoEmergencia.ASIGNADO,
          datos_modificados: {
            id_unidad: data.id_unidad,
            codigo_unidad: unidad.codigo,
            tipo_unidad: unidad.tipo,
            notas_despacho: data.notas_despacho,
          },
        },
      });

      return actualizada;
    });
  }

  // =================================================================
  // 4. INICIAR ATENCIÓN — ASIGNADO → EN_ATENCION
  // =================================================================
  async iniciarAtencion(idEmergencia: number, data: IniciarAtencionInput, idUsuario: number) {
    return prisma.$transaction(async (tx) => {
      const emergencia = await tx.emergencia.findUnique({
        where: { id: idEmergencia },
        include: { unidad: true },
      });

      if (!emergencia) {
        throw httpError(`Emergencia con ID ${idEmergencia} no encontrada`, 404);
      }

      if (emergencia.estado !== EstadoEmergencia.ASIGNADO) {
        throw httpError(
          `No se puede iniciar atención: el estado actual es "${emergencia.estado}". Se requiere estado "ASIGNADO"`,
          409
        );
      }

      // Transicionar: ASIGNADO → EN_ATENCION
      const actualizada = await tx.emergencia.update({
        where: { id: idEmergencia },
        data: {
          estado: EstadoEmergencia.EN_ATENCION,
          notas_atencion: data.notas_atencion,
          fecha_inicio_atencion: new Date(),
        },
        include: INCLUDE_COMPLETO,
      });

      // Actualizar estado de la unidad: DESPACHADA → EN_ESCENA
      if (emergencia.id_unidad) {
        await tx.unidad.update({
          where: { id: emergencia.id_unidad },
          data: { estado: EstadoUnidad.EN_ESCENA },
        });
      }

      // Registrar en auditoría (RNF-09)
      await tx.logAuditoria.create({
        data: {
          id_emergencia: idEmergencia,
          id_usuario_accion: idUsuario,
          accion_realizada: 'Inicio de atención en campo',
          estado_anterior: EstadoEmergencia.ASIGNADO,
          estado_nuevo: EstadoEmergencia.EN_ATENCION,
          datos_modificados: {
            notas_atencion: data.notas_atencion,
          },
        },
      });

      return actualizada;
    });
  }

  // =================================================================
  // 5. CERRAR EMERGENCIA — EN_ATENCION → CERRADO
  // =================================================================
  async cerrarEmergencia(idEmergencia: number, data: CerrarEmergenciaInput, idUsuario: number) {
    return prisma.$transaction(async (tx) => {
      const emergencia = await tx.emergencia.findUnique({
        where: { id: idEmergencia },
        include: { unidad: true },
      });

      if (!emergencia) {
        throw httpError(`Emergencia con ID ${idEmergencia} no encontrada`, 404);
      }

      if (emergencia.estado !== EstadoEmergencia.EN_ATENCION) {
        throw httpError(
          `No se puede cerrar: el estado actual es "${emergencia.estado}". Se requiere estado "EN_ATENCION"`,
          409
        );
      }

      // Transicionar: EN_ATENCION → CERRADO
      const actualizada = await tx.emergencia.update({
        where: { id: idEmergencia },
        data: {
          estado: EstadoEmergencia.CERRADO,
          resolucion: data.resolucion,
          fecha_cierre: new Date(),
        },
        include: INCLUDE_COMPLETO,
      });

      // Liberar la unidad: EN_ESCENA → DISPONIBLE
      if (emergencia.id_unidad) {
        await tx.unidad.update({
          where: { id: emergencia.id_unidad },
          data: { estado: EstadoUnidad.DISPONIBLE },
        });
      }

      // Registrar en auditoría (RNF-09)
      await tx.logAuditoria.create({
        data: {
          id_emergencia: idEmergencia,
          id_usuario_accion: idUsuario,
          accion_realizada: 'Cierre de emergencia',
          estado_anterior: EstadoEmergencia.EN_ATENCION,
          estado_nuevo: EstadoEmergencia.CERRADO,
          datos_modificados: {
            resolucion: data.resolucion,
          },
        },
      });

      return actualizada;
    });
  }

  // =================================================================
  // 6. OBTENER EMERGENCIA POR ID
  // =================================================================
  async obtenerEmergencia(id: number) {
    const emergencia = await prisma.emergencia.findUnique({
      where: { id },
      include: {
        ...INCLUDE_COMPLETO,
        logs_auditoria: {
          orderBy: { fecha: 'desc' },
          include: {
            usuario_accion: {
              select: { id: true, nombre: true, apellido: true, rol: true },
            },
          },
        },
      },
    });

    if (!emergencia) {
      throw httpError(`Emergencia con ID ${id} no encontrada`, 404);
    }

    return emergencia;
  }

  async adjuntarEvidencia(id: number, evidenciaUrl: string, idCiudadano: number) {
    return prisma.$transaction(async (tx) => {
      const existente = await tx.emergencia.findUnique({ where: { id }, select: { id: true, id_ciudadano: true, estado: true } });
      if (!existente) throw httpError(`Emergencia con ID ${id} no encontrada`, 404);
      if (existente.id_ciudadano !== idCiudadano) {
        throw httpError('Solo puedes adjuntar evidencia a tus propios reportes', 403);
      }

      const actualizada = await tx.emergencia.update({
        where: { id },
        data: { evidencia_url: evidenciaUrl },
        include: INCLUDE_COMPLETO,
      });
      await tx.logAuditoria.create({
        data: {
          id_emergencia: id,
          id_usuario_accion: idCiudadano,
          accion_realizada: 'Evidencia fotográfica adjunta por ciudadano',
          estado_anterior: existente.estado,
          estado_nuevo: existente.estado,
          datos_modificados: { evidencia_url: evidenciaUrl },
        },
      });
      return actualizada;
    });
  }

  // =================================================================
  // 7. LISTAR EMERGENCIAS CON FILTROS Y PAGINACIÓN
  // =================================================================
  async listarEmergencias(filtros: {
    estado?: EstadoEmergencia;
    prioridad?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    pagina?: number;
    limite?: number;
  }) {
    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 20;
    const skip = (pagina - 1) * limite;

    // Construir filtro dinámico
    const where: Prisma.EmergenciaWhereInput = {};

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    if (filtros.prioridad) {
      where.prioridad = filtros.prioridad;
    }

    if (filtros.fecha_inicio || filtros.fecha_fin) {
      where.fecha_creacion = {};
      if (filtros.fecha_inicio) {
        where.fecha_creacion.gte = new Date(filtros.fecha_inicio);
      }
      if (filtros.fecha_fin) {
        where.fecha_creacion.lte = new Date(filtros.fecha_fin);
      }
    }

    const [emergencias, total] = await Promise.all([
      prisma.emergencia.findMany({
        where,
        include: {
          ciudadano: {
            select: { id: true, nombre: true, apellido: true },
          },
          tipo_emergencia: {
            select: { id: true, nombre: true, icono: true },
          },
          unidad: {
            select: { id: true, codigo: true, tipo: true },
          },
        },
        orderBy: [{ prioridad: 'asc' }, { fecha_creacion: 'desc' }],
        skip,
        take: limite,
      }),
      prisma.emergencia.count({ where }),
    ]);

    return {
      emergencias,
      paginacion: {
        total,
        pagina,
        limite,
        total_paginas: Math.ceil(total / limite),
      },
    };
  }

  // =================================================================
  // 8. OBTENER HISTORIAL DE AUDITORÍA DE UNA EMERGENCIA
  // =================================================================
  async obtenerHistorial(idEmergencia: number) {
    // Verificar que la emergencia exista
    const emergencia = await prisma.emergencia.findUnique({
      where: { id: idEmergencia },
    });

    if (!emergencia) {
      throw httpError(`Emergencia con ID ${idEmergencia} no encontrada`, 404);
    }

    const logs = await prisma.logAuditoria.findMany({
      where: { id_emergencia: idEmergencia },
      include: {
        usuario_accion: {
          select: { id: true, nombre: true, apellido: true, email: true, rol: true },
        },
      },
      orderBy: { fecha: 'asc' },
    });

    return logs;
  }

  // =================================================================
  // 9. LISTAR EMERGENCIAS DE UN CIUDADANO ESPECÍFICO
  // =================================================================
  async listarMisReportes(idCiudadano: number) {
    return prisma.emergencia.findMany({
      where: { id_ciudadano: idCiudadano },
      include: {
        tipo_emergencia: {
          select: { nombre: true, icono: true },
        },
      },
      orderBy: { fecha_creacion: 'desc' },
    });
  }
}

export const emergenciasService = new EmergenciasService();
