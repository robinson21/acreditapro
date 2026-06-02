import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';

interface CompanyFilters {
  estado?: string;
  busqueda?: string;
  page?: number;
  limit?: number;
}

interface CreateCompanyInput {
  razonSocial: string;
  rut: string;
  giro?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  representanteLegal?: string;
}

interface UpdateCompanyInput {
  razonSocial?: string;
  giro?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  representanteLegal?: string;
}

/**
 * Servicio de gestión de empresas contratistas.
 * CRUD completo con filtros, paginación y auditoría.
 */
export const companyService = {
  /**
   * Lista empresas con paginación y filtros.
   * Filtros disponibles: estado, búsqueda por rut/razón social.
   */
  async list(tenantId: string, filters: CompanyFilters = {}) {
    const { estado, busqueda, page = 1, limit = 20 } = filters;

    const where: Prisma.CompanyWhereInput = {
      tenantId,
    };

    if (estado) {
      where.estado = estado as any;
    }

    if (busqueda) {
      where.OR = [
        { razonSocial: { contains: busqueda } },
        { rut: { contains: busqueda } },
      ];
    }

    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              workers: true,
              contracts: true,
              documents: true,
            },
          },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return {
      data: companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Obtiene una empresa por su ID.
   */
  async getById(id: string, tenantId: string) {
    const company = await prisma.company.findFirst({
      where: { id, tenantId },
      include: {
        workers: {
          where: { estado: 'ACTIVO' },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        contracts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            workers: true,
            contracts: true,
            documents: true,
          },
        },
      },
    });

    if (!company) {
      throw new AppError('Empresa no encontrada', 404, 'COMPANY_NOT_FOUND');
    }

    return company;
  },

  /**
   * Crea una nueva empresa contratista.
   * Verifica que no exista otra empresa con el mismo RUT en el tenant.
   */
  async create(data: CreateCompanyInput, tenantId: string, _userId?: string) {
    // Validar RUT único dentro del tenant
    const existing = await prisma.company.findFirst({
      where: { rut: data.rut, tenantId },
    });

    if (existing) {
      throw new AppError('Ya existe una empresa con este RUT en el tenant', 409, 'COMPANY_DUPLICATE_RUT');
    }

    const company = await prisma.company.create({
      data: {
        ...data,
        tenantId,
      },
    });

    return company;
  },

  /**
   * Actualiza una empresa existente.
   */
  async update(id: string, data: UpdateCompanyInput, tenantId: string) {
    // Verificar que la empresa exista
    const existing = await prisma.company.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Empresa no encontrada', 404, 'COMPANY_NOT_FOUND');
    }

    const company = await prisma.company.update({
      where: { id },
      data,
    });

    return company;
  },

  /**
   * Bloquea una empresa (cambia estado a BLOQUEADO).
   * También bloquea a todos los trabajadores asociados.
   */
  async block(id: string, tenantId: string) {
    const existing = await prisma.company.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Empresa no encontrada', 404, 'COMPANY_NOT_FOUND');
    }

    if (existing.estado === 'BLOQUEADO') {
      throw new AppError('La empresa ya está bloqueada', 400, 'COMPANY_ALREADY_BLOCKED');
    }

    // Bloquear empresa y todos sus trabajadores en una transacción
    const [company] = await prisma.$transaction([
      prisma.company.update({
        where: { id },
        data: { estado: 'BLOQUEADO' },
      }),
      prisma.worker.updateMany({
        where: { companyId: id },
        data: { estado: 'BLOQUEADO' },
      }),
    ]);

    return company;
  },
};
