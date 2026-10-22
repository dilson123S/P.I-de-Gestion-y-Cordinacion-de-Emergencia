/**
 * Servicio para Gestión de Usuarios
 */

import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { RolUsuario } from '@prisma/client';

export class UsuariosService {
  async listar(rol?: RolUsuario) {
    return prisma.usuario.findMany({
      where: rol ? { rol } : {},
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        rol: true,
        activo: true,
        fecha_creacion: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  async obtenerPorId(id: number) {
    return prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        rol: true,
        activo: true,
        fecha_creacion: true,
        unidad_asignada: true,
      },
    });
  }

  async actualizar(id: number, data: { nombre?: string; apellido?: string; telefono?: string; activo?: boolean; rol?: RolUsuario }) {
    return prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        rol: true,
        activo: true,
      },
    });
  }
}

export const usuariosService = new UsuariosService();
