/**
 * Servicio para Catálogo de Tipos de Emergencia (RF-09)
 */

import prisma from '../../lib/prisma';

export interface CrearTipoEmergenciaInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  prioridad_default?: number;
  icono?: string;
}

export class CatalogoService {
  async listar(soloActivos = true) {
    return prisma.catalogoTipoEmergencia.findMany({
      where: soloActivos ? { activo: true } : {},
      orderBy: { prioridad_default: 'asc' },
    });
  }

  async obtenerPorId(id: number) {
    return prisma.catalogoTipoEmergencia.findUnique({
      where: { id },
    });
  }

  async crear(data: CrearTipoEmergenciaInput) {
    return prisma.catalogoTipoEmergencia.create({
      data,
    });
  }

  async actualizar(id: number, data: Partial<CrearTipoEmergenciaInput> & { activo?: boolean }) {
    return prisma.catalogoTipoEmergencia.update({
      where: { id },
      data,
    });
  }

  async eliminar(id: number) {
    // Desactivación lógica
    return prisma.catalogoTipoEmergencia.update({
      where: { id },
      data: { activo: false },
    });
  }
}

export const catalogoService = new CatalogoService();
