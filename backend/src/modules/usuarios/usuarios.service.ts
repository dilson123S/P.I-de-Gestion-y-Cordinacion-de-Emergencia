/**
 * Servicio para Gestión de Usuarios
 */

import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { RolUsuario, EstadoUnidad } from '@prisma/client';

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
        unidad_asignada: {
          select: {
            id: true,
            codigo: true,
            tipo: true,
            placa: true,
            estado: true,
            latitud_actual: true,
            longitud_actual: true,
          },
        },
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

  async actualizar(
    id: number,
    data: {
      nombre?: string;
      apellido?: string;
      email?: string;
      telefono?: string;
      activo?: boolean;
      rol?: RolUsuario;
      password?: string;
      sigla_unidad?: string;
    }
  ) {
    const updateData: any = { ...data };
    const siglaUnidad = data.sigla_unidad;
    delete updateData.sigla_unidad;

    if (data.password) {
      updateData.password_hash = await bcrypt.hash(data.password, 10);
      delete updateData.password;
    }
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();
    }

    return prisma.$transaction(async (tx) => {
      const usuarioActualizado = await tx.usuario.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          telefono: true,
          rol: true,
          activo: true,
          unidad_asignada: true,
        },
      });

      // Si es o pasa a ser Personal de Campo y no tiene unidad asignada (o se especificó sigla nueva), aprovisionarla
      if (usuarioActualizado.rol === RolUsuario.PERSONAL_CAMPO) {
        if (!usuarioActualizado.unidad_asignada || siglaUnidad) {
          await this.asignarUnidadAutomatica(
            tx,
            usuarioActualizado.id,
            usuarioActualizado.nombre,
            usuarioActualizado.apellido,
            siglaUnidad
          );
        }
      }

      return tx.usuario.findUnique({
        where: { id },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          telefono: true,
          rol: true,
          activo: true,
          unidad_asignada: {
            select: {
              id: true,
              codigo: true,
              tipo: true,
              placa: true,
              estado: true,
            },
          },
        },
      });
    });
  }

  async eliminar(id: number) {
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      const error = new Error('Usuario no encontrado');
      (error as any).statusCode = 404;
      throw error;
    }

    if (usuario.id === 1 && usuario.rol === RolUsuario.ADMIN) {
      const error = new Error('No se puede eliminar la cuenta de administración principal del sistema');
      (error as any).statusCode = 400;
      throw error;
    }

    // Desvincular de unidades si tenía una asociada como personal de campo
    await prisma.unidad.updateMany({
      where: { id_personal: id },
      data: { id_personal: null },
    });

    const [reportes, despachos, clasificaciones] = await Promise.all([
      prisma.emergencia.count({ where: { id_ciudadano: id } }),
      prisma.emergencia.count({ where: { id_despachador: id } }),
      prisma.emergencia.count({ where: { id_operador: id } }),
    ]);

    // Si tiene registros en el ciclo de vida de emergencias, se aplica baja lógica
    // para preservar de forma estricta la trazabilidad y auditoría forense RNF-09
    if (reportes > 0 || despachos > 0 || clasificaciones > 0) {
      return prisma.usuario.update({
        where: { id },
        data: {
          activo: false,
          nombre: `[Inactivo] ${usuario.nombre}`,
        },
        select: {
          id: true,
          email: true,
          activo: true,
        },
      });
    }

    // Eliminación física si no tiene historial dependiente
    return prisma.usuario.delete({
      where: { id },
      select: {
        id: true,
        email: true,
      },
    });
  }

  async crear(data: {
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    password?: string;
    rol: RolUsuario;
    sigla_unidad?: string;
  }) {
    const passwordHash = await bcrypt.hash(data.password || 'sigem1234', 10);

    return prisma.$transaction(async (tx) => {
      const nuevoUsuario = await tx.usuario.create({
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email.toLowerCase().trim(),
          telefono: data.telefono,
          password_hash: passwordHash,
          rol: data.rol,
          activo: true,
        },
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
      });

      // Si es Personal de Campo, generar y asignar automáticamente su Unidad con sigla y número correlativo
      if (data.rol === RolUsuario.PERSONAL_CAMPO) {
        await this.asignarUnidadAutomatica(
          tx,
          nuevoUsuario.id,
          nuevoUsuario.nombre,
          nuevoUsuario.apellido,
          data.sigla_unidad
        );
      }

      return tx.usuario.findUnique({
        where: { id: nuevoUsuario.id },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          telefono: true,
          rol: true,
          activo: true,
          fecha_creacion: true,
          unidad_asignada: {
            select: {
              id: true,
              codigo: true,
              tipo: true,
              placa: true,
              estado: true,
            },
          },
        },
      });
    });
  }

  /**
   * Genera y vincula automáticamente una unidad operativa con sigla institucional y número correlativo (ej: PL-01, AM-01)
   */
  private async asignarUnidadAutomatica(
    tx: any,
    idUsuario: number,
    nombreUsuario: string,
    apellidoUsuario: string,
    siglaDeseada?: string
  ) {
    const sigla = (siglaDeseada || 'PL').toUpperCase().trim();
    const descripcionesCuerpo: Record<string, string> = {
      PL: 'Patrulla Policial',
      AM: 'Ambulancia Médica',
      BM: 'Autobomba de Bomberos',
      TR: 'Unidad de Tránsito',
      DC: 'Defensa Civil / Rescate',
    };
    const cuerpoNombre = descripcionesCuerpo[sigla] || `Unidad Táctica ${sigla}`;

    // Obtener unidades con este prefijo para calcular el correlativo
    const unidadesExistentes = await tx.unidad.findMany({
      where: {
        codigo: {
          startsWith: `${sigla}-`,
        },
      },
      select: { codigo: true },
    });

    let maxNumero = 0;
    for (const u of unidadesExistentes) {
      const partes = u.codigo.split('-');
      if (partes.length >= 2) {
        const num = parseInt(partes[1], 10);
        if (!isNaN(num) && num > maxNumero) {
          maxNumero = num;
        }
      }
    }

    const siguienteNumero = maxNumero + 1;
    const codigoUnidad = `${sigla}-${String(siguienteNumero).padStart(2, '0')}`;
    const placaAleatoria = `${sigla}-${Math.floor(100 + Math.random() * 900)}`;

    // Coordenadas base en Cartagena
    const latBase = 10.4120 + (Math.random() - 0.5) * 0.02;
    const lonBase = -75.5310 + (Math.random() - 0.5) * 0.02;

    // Si el usuario ya tenía una unidad anterior, desvincularla
    await tx.unidad.updateMany({
      where: { id_personal: idUsuario },
      data: { id_personal: null },
    });

    return tx.unidad.create({
      data: {
        codigo: codigoUnidad,
        tipo: `${cuerpoNombre} - ${nombreUsuario} ${apellidoUsuario}`,
        placa: placaAleatoria,
        estado: EstadoUnidad.DISPONIBLE,
        latitud_actual: parseFloat(latBase.toFixed(4)),
        longitud_actual: parseFloat(lonBase.toFixed(4)),
        id_personal: idUsuario,
      },
    });
  }
}

export const usuariosService = new UsuariosService();
