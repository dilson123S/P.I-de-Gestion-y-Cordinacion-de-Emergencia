/**
 * Esquemas de validación Zod para el módulo de autenticación
 * Define las reglas de validación para registro e inicio de sesión
 */

import { z } from 'zod';

/**
 * Esquema de validación para el inicio de sesión
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .email('El correo electrónico no tiene un formato válido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

/**
 * Esquema de validación para el registro de usuarios
 */
export const registerSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  apellido: z
    .string({ required_error: 'El apellido es obligatorio' })
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(100, 'El apellido no puede exceder 100 caracteres'),
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .email('El correo electrónico no tiene un formato válido'),
  telefono: z
    .string()
    .min(8, 'El teléfono debe tener al menos 8 caracteres')
    .optional(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
  rol: z
    .enum(['CIUDADANO', 'OPERADOR', 'DESPACHADOR', 'PERSONAL_CAMPO', 'ADMIN'], {
      errorMap: () => ({
        message: 'El rol debe ser uno de: CIUDADANO, OPERADOR, DESPACHADOR, PERSONAL_CAMPO, ADMIN',
      }),
    })
    .default('CIUDADANO'),
});

/** Tipos inferidos de los esquemas */
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
