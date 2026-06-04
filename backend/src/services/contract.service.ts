import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface CreateContractInput {
  companyId: string;
  projectId?: string;
  numeroContrato: string;
  fechaInicio?: string;
  fechaTermino?: string;
}

/**
 * Servicio de gestión de contratos.
 * CRUD básico con filtros por tenant.
 */
export const contractService = {
  /**
   * Lista contratos con paginación.
   */
  async list(tenantId: string) {
    const contracts = await prisma.contract.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, razonSocial: true } },
        project: { select: { id: true, nombre: true } },
        _count: {
          select: { documents: true },
        },
      },
    });

    return { data: contracts };
  },

  /**
   * Obtiene un contrato por su ID.
   */
  async getById(id: string, tenantId: string) {
    const contract = await prisma.contract.findFirst({
      where: { id, tenantId },
      include: {
        company: { select: { id: true, razonSocial: true } },
        project: { select: { id: true, nombre: true } },
        documents: true,
      },
    });

    if (!contract) {
      throw new AppError('Contrato no encontrado', 404, 'CONTRACT_NOT_FOUND');
    }

    return contract;
  },

  /**
   * Crea un nuevo contrato.
   */
  async create(data: CreateContractInput, tenantId: string) {
    const contract = await prisma.contract.create({
      data: {
        companyId: data.companyId,
        projectId: data.projectId || null,
        numeroContrato: data.numeroContrato,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null,
        fechaTermino: data.fechaTermino ? new Date(data.fechaTermino) : null,
        tenantId,
      },
    });

    return contract;
  },
};
