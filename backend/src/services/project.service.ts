import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface CreateProjectInput {
  nombre: string;
  cliente?: string;
  fechaInicio?: string;
  fechaTermino?: string;
}

/**
 * Servicio de gestión de proyectos.
 * CRUD básico con filtros por tenant.
 */
export const projectService = {
  /**
   * Lista proyectos con paginación.
   */
  async list(tenantId: string) {
    const projects = await prisma.project.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { contracts: true },
        },
      },
    });

    return { data: projects };
  },

  /**
   * Obtiene un proyecto por su ID.
   */
  async getById(id: string, tenantId: string) {
    const project = await prisma.project.findFirst({
      where: { id, tenantId },
      include: {
        contracts: true,
        _count: {
          select: { contracts: true },
        },
      },
    });

    if (!project) {
      throw new AppError('Proyecto no encontrado', 404, 'PROJECT_NOT_FOUND');
    }

    return project;
  },

  /**
   * Crea un nuevo proyecto.
   */
  async create(data: CreateProjectInput, tenantId: string) {
    const project = await prisma.project.create({
      data: {
        nombre: data.nombre,
        cliente: data.cliente || null,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
        fechaTermino: data.fechaTermino ? new Date(data.fechaTermino) : null,
        tenantId,
      },
    });

    return project;
  },
};
