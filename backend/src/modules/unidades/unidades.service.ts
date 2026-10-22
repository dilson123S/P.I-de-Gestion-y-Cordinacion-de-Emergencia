/**
 * Servicio para Unidades de Emergencia (Ambulancias, Bomberos, Patrullas)
 */

import prisma from '../../lib/prisma';
import { EstadoUnidad } from '@prisma/client';

export interface CrearUnidadInput {
  codigo: string;
  tipo: string;
  placa?: string;
  estado?: EstadoUnidad;
  latitud_actual?: number;
  longitud_actual?: number;
  id_personal?: number;
}

export class UnidadesService {
  async listar(estado?: EstadoUnidad) {
    return prisma.unidad.findMany({
      where: estado ? { estado } : {},
      include: {
        personal: {
          select: { id: true, nombre: true, apellido: true, telefono: true },
        },
      },
      orderBy: { codigo: 'asc' },
    });
  }

  async obtenerPorId(id: number) {
    return prisma.unidad.findUnique({
      where: { id },
      include: {
        personal: true,
        emergencias: {
          take: 5,
          orderBy: { fecha_creacion: 'desc' },
        },
      },
    });
  }

  async crear(data: CrearUnidadInput) {
    return prisma.unidad.create({
      data,
    });
  }

  async actualizarUbicacion(id: number, latitud: number, longitud: number) {
    return prisma.unidad.update({
      where: { id },
      data: {
        latitud_actual: latitud,
        longitud_actual: longitud,
      },
    });
  }

  async cambiarEstado(id: number, estado: EstadoUnidad) {
    return prisma.unidad.update({
      where: { id },
      data: { estado },
    });
  }
}

export const unidadesService = new UnidadesService();
