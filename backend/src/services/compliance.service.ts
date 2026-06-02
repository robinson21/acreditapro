import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface ComplianceResult {
  workerId?: string;
  companyId?: string;
  contractId?: string;
  estadoGlobal: 'CUMPLE' | 'NO_CUMPLE' | 'OBSERVADO';
  cumplimientoPorcentaje: number;
  totalReglas: number;
  reglasCumplidas: number;
  reglasNoCumplidas: number;
  reglasPorVencer: number;
  detalles: ComplianceDetalle[];
}

interface ComplianceDetalle {
  reglaId: string;
  reglaNombre: string;
  tipoDocumento: string;
  obligatorio: boolean;
  diasAdvertencia: number;
  estado: 'CUMPLE' | 'NO_CUMPLE' | 'POR_VENCER' | 'VENCIDO';
  documentoId?: string;
  fechaVencimiento?: Date;
  observaciones?: string;
}

/**
 * Motor de cumplimiento normativo.
 * Evalúa trabajadores, empresas y contratos contra las reglas de compliance configuradas.
 */
export const complianceService = {
  /**
   * Evalúa TODOS los requisitos para un trabajador según su cargo
   * y las ComplianceRules asignadas.
   * Retorna estado de acreditación y lista de documentos faltantes/vencidos.
   */
  async evaluateWorker(workerId: string): Promise<ComplianceResult> {
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: { company: true, documents: true },
    });

    if (!worker) {
      throw new AppError('Trabajador no encontrado', 404, 'WORKER_NOT_FOUND');
    }

    // Obtener reglas aplicables al cargo del trabajador o sin cargo específico
    const rules = await prisma.complianceRule.findMany({
      where: {
        tenantId: worker.company.tenantId,
        activo: true,
        OR: [
          { cargo: worker.cargo || undefined },
          { cargo: null },
        ],
      },
    });

    return this.evaluateAgainstRules(worker.documents, rules, {
      workerId: worker.id,
      companyId: worker.companyId,
    });
  },

  /**
   * Evalúa todas las reglas de compliance para una empresa.
   * Revisa todos los trabajadores activos de la empresa.
   */
  async evaluateCompany(companyId: string): Promise<ComplianceResult> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        workers: {
          where: { estado: 'ACTIVO' },
          include: { documents: true },
        },
        documents: true,
      },
    });

    if (!company) {
      throw new AppError('Empresa no encontrada', 404, 'COMPANY_NOT_FOUND');
    }

    // Obtener reglas asignadas a la empresa o generales del tenant
    const rules = await prisma.complianceRule.findMany({
      where: {
        tenantId: company.tenantId,
        activo: true,
        OR: [
          { assignments: { some: { companyId } } },
          { cargo: null },
        ],
      },
    });

    return this.evaluateAgainstRules(
      [...company.documents, ...company.workers.flatMap((w) => w.documents)],
      rules,
      { companyId }
    );
  },

  /**
   * Evalúa por contrato. Revisa documentos del contrato y de la empresa asociada.
   */
  async evaluateContract(contractId: string): Promise<ComplianceResult> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        company: {
          include: { documents: true },
        },
        documents: true,
      },
    });

    if (!contract) {
      throw new AppError('Contrato no encontrado', 404, 'CONTRACT_NOT_FOUND');
    }

    // Reglas asignadas al contrato
    const rules = await prisma.complianceRule.findMany({
      where: {
        tenantId: contract.tenantId,
        activo: true,
        OR: [
          { assignments: { some: { contractId } } },
          { cargo: null },
        ],
      },
    });

    return this.evaluateAgainstRules(
      [...contract.documents, ...contract.company.documents],
      rules,
      { contractId, companyId: contract.companyId }
    );
  },

  /**
   * Evalúa documentos contra un conjunto de reglas de compliance.
   */
  async evaluateAgainstRules(
    documents: any[],
    rules: any[],
    context: { workerId?: string; companyId?: string; contractId?: string }
  ): Promise<ComplianceResult> {
    const now = new Date();
    const detalles: ComplianceDetalle[] = [];
    let cumplidas = 0;
    let noCumplidas = 0;
    let porVencer = 0;

    for (const rule of rules) {
      const tipoRule = rule.tipoDocumento as string;
      const diasAdvertencia = rule.diasAdvertencia || 30;
      const fechaLimiteAdvertencia = new Date(now.getTime() + diasAdvertencia * 24 * 60 * 60 * 1000);

      // Buscar documentos que cumplan con esta regla
      const docsCumplen = documents.filter((doc: any) => {
        if (doc.tipoDocumento !== tipoRule) return false;
        if (context.workerId && doc.workerId && doc.workerId !== context.workerId) return false;
        return doc.estado === 'APROBADO';
      });

      if (docsCumplen.length === 0) {
        // No hay documentos que cumplan
        detalles.push({
          reglaId: rule.id,
          reglaNombre: rule.nombre,
          tipoDocumento: tipoRule,
          obligatorio: rule.obligatorio,
          diasAdvertencia,
          estado: 'NO_CUMPLE',
          observaciones: `No se encontró documento ${tipoRule} aprobado`,
        });
        if (rule.obligatorio) noCumplidas++;
      } else {
        // Hay documentos, verificar vencimiento
        const mejoresDocs = docsCumplen.sort(
          (a: any, b: any) => (b.fechaVencimiento?.getTime() || 0) - (a.fechaVencimiento?.getTime() || 0)
        );
        const mejorDoc = mejoresDocs[0];

        if (mejorDoc.fechaVencimiento && mejorDoc.fechaVencimiento < now) {
          detalles.push({
            reglaId: rule.id,
            reglaNombre: rule.nombre,
            tipoDocumento: tipoRule,
            obligatorio: rule.obligatorio,
            diasAdvertencia,
            estado: 'VENCIDO',
            documentoId: mejorDoc.id,
            fechaVencimiento: mejorDoc.fechaVencimiento,
            observaciones: `Documento vencido desde ${mejorDoc.fechaVencimiento.toISOString().split('T')[0]}`,
          });
          if (rule.obligatorio) noCumplidas++;
        } else if (mejorDoc.fechaVencimiento && mejorDoc.fechaVencimiento <= fechaLimiteAdvertencia) {
          detalles.push({
            reglaId: rule.id,
            reglaNombre: rule.nombre,
            tipoDocumento: tipoRule,
            obligatorio: rule.obligatorio,
            diasAdvertencia,
            estado: 'POR_VENCER',
            documentoId: mejorDoc.id,
            fechaVencimiento: mejorDoc.fechaVencimiento,
            observaciones: `Documento próximo a vencer: ${mejorDoc.fechaVencimiento.toISOString().split('T')[0]}`,
          });
          cumplidas++;
          porVencer++;
        } else {
          detalles.push({
            reglaId: rule.id,
            reglaNombre: rule.nombre,
            tipoDocumento: tipoRule,
            obligatorio: rule.obligatorio,
            diasAdvertencia,
            estado: 'CUMPLE',
            documentoId: mejorDoc.id,
            fechaVencimiento: mejorDoc.fechaVencimiento,
          });
          cumplidas++;
        }
      }
    }

    const totalReglas = rules.length;
    const cumplimientoPorcentaje = totalReglas > 0 ? Math.round((cumplidas / totalReglas) * 100) : 100;

    let estadoGlobal: 'CUMPLE' | 'NO_CUMPLE' | 'OBSERVADO';
    if (porVencer > 0 && noCumplidas === 0) {
      estadoGlobal = 'OBSERVADO';
    } else if (noCumplidas > 0) {
      estadoGlobal = 'NO_CUMPLE';
    } else {
      estadoGlobal = 'CUMPLE';
    }

    return {
      ...context,
      estadoGlobal,
      cumplimientoPorcentaje,
      totalReglas,
      reglasCumplidas: cumplidas,
      reglasNoCumplidas: noCumplidas,
      reglasPorVencer: porVencer,
      detalles,
    };
  },

  /**
   * Genera un reporte completo de cumplimiento.
   * Incluye evaluación de la entidad y resumen de reglas.
   */
  async generateReport(entityType: string, entityId: string): Promise<any> {
    let evaluation: ComplianceResult;

    switch (entityType) {
      case 'worker':
        evaluation = await this.evaluateWorker(entityId);
        break;
      case 'company':
        evaluation = await this.evaluateCompany(entityId);
        break;
      case 'contract':
        evaluation = await this.evaluateContract(entityId);
        break;
      default:
        throw new AppError('Tipo de entidad inválido', 400, 'INVALID_ENTITY_TYPE');
    }

    return {
      generadoEn: new Date().toISOString(),
      entidad: entityType,
      entidadId: entityId,
      ...evaluation,
    };
  },
};
