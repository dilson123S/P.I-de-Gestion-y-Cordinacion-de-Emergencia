/**
 * Servicio de autenticación
 * Lógica de negocio para registro e inicio de sesión de usuarios
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';
import { config } from '../../config';
import { RegisterInput, LoginInput } from './auth.schemas';
import { RolUsuario } from '@prisma/client';

/** Número de rondas de salt para bcrypt */
const SALT_ROUNDS = 10;

/**
 * Registra un nuevo usuario en el sistema
 * @param data - Datos del formulario de registro validados con Zod
 * @returns El usuario creado (sin el hash de contraseña)
 * @throws Error si el correo ya está registrado
 */
export async function register(data: RegisterInput) {
  // Verificar si el correo ya existe en la base de datos
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email: data.email },
  });

  if (usuarioExistente) {
    const error = new Error('El correo electrónico ya está registrado');
    (error as any).statusCode = 409;
    throw error;
  }

  // Generar el hash de la contraseña
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Crear el usuario en la base de datos
  const nuevoUsuario = await prisma.usuario.create({
    data: {
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      telefono: data.telefono || null,
      password_hash: passwordHash,
      rol: data.rol as RolUsuario,
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

  return nuevoUsuario;
}

/**
 * Autentica un usuario y genera un token JWT
 * @param data - Credenciales de inicio de sesión
 * @returns Objeto con el token JWT y los datos del usuario
 * @throws Error si las credenciales son inválidas o la cuenta está desactivada
 */
export async function login(data: LoginInput) {
  // Buscar el usuario por correo electrónico
  const usuario = await prisma.usuario.findUnique({
    where: { email: data.email },
  });

  if (!usuario) {
    const error = new Error('Credenciales inválidas');
    (error as any).statusCode = 401;
    throw error;
  }

  // Verificar que la cuenta esté activa
  if (!usuario.activo) {
    const error = new Error('La cuenta se encuentra desactivada. Contacte al administrador.');
    (error as any).statusCode = 403;
    throw error;
  }

  // Comparar la contraseña proporcionada con el hash almacenado
  const passwordValida = await bcrypt.compare(data.password, usuario.password_hash);

  if (!passwordValida) {
    const error = new Error('Credenciales inválidas');
    (error as any).statusCode = 401;
    throw error;
  }

  // Generar el token JWT con los datos esenciales del usuario
  const payload = {
    id: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
  };

  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
    },
  };
}
