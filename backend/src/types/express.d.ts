import { Request } from 'express';

// Augmentar Express Request con la propiedad user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        rol: string;
        tenantId: string;
      };
    }
  }
}

export {};

// Tipo auxiliar para controllers que requieren autenticación
export type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
    rol: string;
    tenantId: string;
  };
};
