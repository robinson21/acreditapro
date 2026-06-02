import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database';
import { CONFIG } from '../config';
import { AppError } from '../middleware/errorHandler';

interface LoginInput {
  email: string;
  password: string;
  tenantId?: string;
}

interface UserPayload {
  id: string;
  email: string;
  rol: string;
  tenantId: string;
}

/**
 * Servicio de autenticación.
 * Maneja login, refresh token, cambio de contraseña y generación de JWT.
 */
export const authService = {
  /**
   * Inicia sesión con email, password y tenantId.
   * Verifica credenciales, genera JWT + refresh token y guarda el refresh token en DB.
   */
  async login(input: LoginInput) {
    const { email, password } = input;
    
    // Auto-detectar tenantId si no se proporciona
    let tenantId = input.tenantId;
    if (!tenantId) {
      const tenant = await prisma.tenant.findFirst();
      if (!tenant) {
        throw new AppError('No hay tenants configurados en el sistema', 500, 'AUTH_NO_TENANT');
      }
      tenantId = tenant.id;
    }

    // Buscar usuario por email y tenant
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        tenantId,
        activo: true,
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new AppError('Credenciales inválidas', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    // Verificar que el tenant esté activo
    if (user.tenant.estado !== 'ACTIVO') {
      throw new AppError('El tenant se encuentra inactivo', 403, 'AUTH_TENANT_INACTIVE');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Credenciales inválidas', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    // Generar tokens
    const accessToken = this.generateToken({
      id: user.id,
      email: user.email,
      rol: user.rol,
      tenantId: user.tenantId,
    });

    const refreshToken = this.generateRefreshToken();

    // Guardar refresh token en DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        ultimoAcceso: new Date(),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: CONFIG.JWT_EXPIRES_IN,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rut: user.rut,
        rol: user.rol,
        cargo: user.cargo,
        tenantId: user.tenantId,
      },
    };
  },

  /**
   * Refresca el token de acceso usando un refresh token válido.
   */
  async refreshToken(token: string) {
    // Buscar usuario con ese refresh token
    const user = await prisma.user.findFirst({
      where: {
        refreshToken: token,
        activo: true,
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new AppError('Refresh token inválido o expirado', 401, 'AUTH_INVALID_REFRESH_TOKEN');
    }

    if (user.tenant.estado !== 'ACTIVO') {
      throw new AppError('El tenant se encuentra inactivo', 403, 'AUTH_TENANT_INACTIVE');
    }

    // Generar nuevos tokens
    const accessToken = this.generateToken({
      id: user.id,
      email: user.email,
      rol: user.rol,
      tenantId: user.tenantId,
    });

    const newRefreshToken = this.generateRefreshToken();

    // Actualizar refresh token en DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: newRefreshToken,
        ultimoAcceso: new Date(),
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: CONFIG.JWT_EXPIRES_IN,
    };
  },

  /**
   * Cambia la contraseña del usuario.
   * Verifica la contraseña actual antes de cambiarla.
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404, 'AUTH_USER_NOT_FOUND');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('La contraseña actual es incorrecta', 400, 'AUTH_INVALID_PASSWORD');
    }

    // Validar nueva contraseña
    if (newPassword.length < 8) {
      throw new AppError('La nueva contraseña debe tener al menos 8 caracteres', 400, 'AUTH_WEAK_PASSWORD');
    }

    // Encriptar y guardar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        refreshToken: null, // Invalidar todos los refresh tokens existentes
      },
    });

    return { message: 'Contraseña cambiada exitosamente' };
  },

  /**
   * Genera un token JWT firmado con la información del usuario.
   */
  generateToken(user: UserPayload): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol,
        tenantId: user.tenantId,
      },
      CONFIG.JWT_SECRET,
      {
        expiresIn: CONFIG.JWT_EXPIRES_IN as any,
      }
    );
  },

  /**
   * Genera un refresh token aleatorio y seguro.
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  },
};
