import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { complianceService } from '../services/compliance.service';
import { reportService } from '../services/report.service';
import { AppError } from '../middleware/errorHandler';

/**
 * Controlador de compliance y reportes.
 * Evalúa trabajadores, empresas, contratos y genera reportes.
 */
export const complianceController = {
  /**
   * GET /api/compliance/worker/:workerId
   * Evalúa el cumplimiento de un trabajador.
   */
  async evaluateWorker(req: Request, res: Response, next: NextFunction) {
    try {
      const params = req.params as Record<string, string>;
      const { workerId } = params;
      const result = await complianceService.evaluateWorker(workerId);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/compliance/company/:companyId
   * Evalúa el cumplimiento de una empresa.
   */
  async evaluateCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const params = req.params as Record<string, string>;
      const { companyId } = params;
      const result = await complianceService.evaluateCompany(companyId);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/compliance/contract/:contractId
   * Evalúa el cumplimiento de un contrato.
   */
  async evaluateContract(req: Request, res: Response, next: NextFunction) {
    try {
      const params = req.params as Record<string, string>;
      const { contractId } = params;
      const result = await complianceService.evaluateContract(contractId);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/compliance/report/:type/:id
   * Genera un reporte de cumplimiento.
   * type: 'company', 'worker', 'contract'
   * query: formato (pdf, excel)
   */
  async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const params = req.params as Record<string, string>;
      const { type, id } = params;
      const formato = (req.query.formato as string) || 'json';

      if (!['company', 'worker', 'contract'].includes(type)) {
        throw new AppError('Tipo de reporte inválido. Use: company, worker, contract', 400, 'INVALID_REPORT_TYPE');
      }

      if (formato === 'pdf') {
        if (type !== 'company') {
          throw new AppError('El formato PDF solo está disponible para reportes de empresa', 400, 'INVALID_FORMAT');
        }
        const filePath = await reportService.generateCompliancePdf(id);
        const filename = path.basename(filePath);
        res.download(filePath, filename);
      } else if (formato === 'excel') {
        if (type !== 'company') {
          throw new AppError('El formato Excel solo está disponible para reportes de empresa', 400, 'INVALID_FORMAT');
        }
        const filePath = await reportService.generateComplianceExcel(id);
        const filename = path.basename(filePath);
        res.download(filePath, filename);
      } else {
        // JSON
        const result = await complianceService.generateReport(type, id);
        res.json({ ok: true, data: result });
      }
    } catch (error) {
      next(error);
    }
  },
};
