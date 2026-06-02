import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';

interface WorkerFilters {
  companyId?: string;
  estado?: string;
  busqueda?: string;
  page?: number;
  limit?: number;
}

interface CreateWorkerInput {
  companyId: string;
  nombreCompleto: string;
  rut: string;
  fechaNacimiento?: string;
  cargo?: string;
  correo?: string;
  telefono?: string;
}

interface UpdateWorkerInput {
  nombreCompleto?: string;
  fechaNacimiento?: string;
  cargo?: string;
  correo?: string;
  telefono?: string;
}

/**
 * Servicio de gestión de trabajadores.
 * CRUD completo con filtros por empresa y paginación.
 */
export const workerService = {
  /**
   * Lista trabajadores con paginación y filtros.
   * Filtros disponibles: companyId, estado, búsqueda por rut/nombre.
   */
  async list(tenantId: string, companyId: string | undefined, filters: WorkerFilters = {}) {
    const { estado, busqueda, page = 1, limit = 20 } = filters;

    const where: Prisma.WorkerWhereInput = {
      company: { tenantId },
    };

    if (companyId) {
      where.companyId = companyId;
    }

    if (estado) {
      where.estado = estado as any;
    }

    if (busqueda) {
      where.OR = [
        { nombreCompleto: { contains: busqueda } },
        { rut: { contains: busqueda } },
      ];
    }

    const skip = (page - 1) * limit;

    const [workers, total] = await Promise.all([
      prisma.worker.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              razonSocial: true,
              rut: true,
            },
          },
          _count: {
            select: {
              documents: true,
            },
          },
        },
      }),
      prisma.worker.count({ where }),
    ]);

    return {
      data: workers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Obtiene un trabajador por su ID.
   */
  async getById(id: string) {
    const worker = await prisma.worker.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            razonSocial: true,
            rut: true,
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!worker) {
      throw new AppError('Trabajador no encontrado', 404, 'WORKER_NOT_FOUND');
    }

    return worker;
  },

  /**
   * Crea un nuevo trabajador.
   */
  async create(data: CreateWorkerInput, tenantId: string) {
    // Verificar que la empresa exista y pertenezca al tenant
    const company = await prisma.company.findFirst({
      where: { id: data.companyId, tenantId },
    });

    if (!company) {
      throw new AppError('Empresa no encontrada', 404, 'COMPANY_NOT_FOUND');
    }

    // Validar RUT único dentro de la empresa
    const existing = await prisma.worker.findFirst({
      where: { rut: data.rut, companyId: data.companyId },
    });

    if (existing) {
      throw new AppError('Ya existe un trabajador con este RUT en la empresa', 409, 'WORKER_DUPLICATE_RUT');
    }

    const worker = await prisma.worker.create({
      data: {
        companyId: data.companyId,
        nombreCompleto: data.nombreCompleto,
        rut: data.rut,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
        cargo: data.cargo,
        correo: data.correo,
        telefono: data.telefono,
      },
    });

    return worker;
  },

  /**
   * Actualiza un trabajador existente.
   */
  async update(id: string, data: UpdateWorkerInput) {
    const existing = await prisma.worker.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Trabajador no encontrado', 404, 'WORKER_NOT_FOUND');
    }

    const updateData: any = { ...data };
    if (data.fechaNacimiento) {
      updateData.fechaNacimiento = new Date(data.fechaNacimiento);
    }

    const worker = await prisma.worker.update({
      where: { id },
      data: updateData,
    });

    return worker;
  },

  /**
   * Bloquea un trabajador (cambia estado a BLOQUEADO).
   */
  async block(id: string) {
    const existing = await prisma.worker.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Trabajador no encontrado', 404, 'WORKER_NOT_FOUND');
    }

    if (existing.estado === 'BLOQUEADO') {
      throw new AppError('El trabajador ya está bloqueado', 400, 'WORKER_ALREADY_BLOCKED');
    }

    const worker = await prisma.worker.update({
      where: { id },
      data: { estado: 'BLOQUEADO' },
    });

    return worker;
  },
};
