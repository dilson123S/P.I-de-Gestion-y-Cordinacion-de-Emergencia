import { RolUsuario } from '@prisma/client';

export interface JwtPayload {
  id: number;
  email: string;
  rol: RolUsuario;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}
