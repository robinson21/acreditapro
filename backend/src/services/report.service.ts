import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import prisma from '../config/database';
import { CONFIG } from '../config';
import { AppError } from '../middleware/errorHandler';
import { complianceService } from './compliance.service';

/**
 * Servicio de generación de reportes.
 * Genera PDFs y Excel profesionales con datos de cumplimiento y estadísticas.
 */
export const reportService = {
  /**
   * Genera un PDF profesional con el reporte de cumplimiento de una empresa.
   * Usa PDFKit para crear el documento.
   */
  async generateCompliancePdf(companyId: string): Promise<string> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        tenant: true,
        workers: {
          where: { estado: 'ACTIVO' },
          include: { documents: { where: { estado: 'APROBADO' } } },
        },
        documents: { where: { estado: 'APROBADO' } },
      },
    });

    if (!company) {
      throw new AppError('Empresa no encontrada', 404, 'COMPANY_NOT_FOUND');
    }

    // Evaluar compliance
    const complianceResult = await complianceService.evaluateCompany(companyId);

    // Crear directorio de reportes si no existe
    const reportsDir = path.join(CONFIG.UPLOAD_DIR, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `compliance-${company.rut}-${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, filename);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Reporte de Cumplimiento - ${company.razonSocial}`,
            Author: 'AcreditaPro',
            Subject: 'Reporte de Compliance',
          },
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Encabezado
        doc.fontSize(20).font('Helvetica-Bold').text('AcreditaPro', { align: 'center' });
        doc.fontSize(14).text('Reporte de Cumplimiento Normativo', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, { align: 'right' });
        doc.moveDown();

        // Línea separadora
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown();

        // Información de la empresa
        doc.fontSize(14).font('Helvetica-Bold').text('Información de la Empresa');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Razón Social: ${company.razonSocial}`);
        doc.text(`RUT: ${company.rut}`);
        doc.text(`Giro: ${company.giro || 'No especificado'}`);
        doc.text(`Dirección: ${company.direccion || 'No especificada'}`);
        doc.text(`Teléfono: ${company.telefono || 'No especificado'}`);
        doc.text(`Correo: ${company.correo || 'No especificado'}`);
        doc.moveDown();

        // Resumen de cumplimiento
        doc.fontSize(14).font('Helvetica-Bold').text('Resumen de Cumplimiento');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');

        const estadoColors: Record<string, string> = {
          CUMPLE: '#22c55e',
          OBSERVADO: '#f59e0b',
          NO_CUMPLE: '#ef4444',
        };

        doc.fontSize(12).font('Helvetica-Bold');
        doc.fillColor(estadoColors[complianceResult.estadoGlobal] || '#000');
        doc.text(`Estado Global: ${complianceResult.estadoGlobal}`);
        doc.fillColor('#000');
        doc.fontSize(10).font('Helvetica');
        doc.text(`Cumplimiento: ${complianceResult.cumplimientoPorcentaje}%`);
        doc.text(`Reglas totales: ${complianceResult.totalReglas}`);
        doc.text(`Reglas cumplidas: ${complianceResult.reglasCumplidas}`);
        doc.text(`Reglas no cumplidas: ${complianceResult.reglasNoCumplidas}`);
        doc.text(`Reglas por vencer: ${complianceResult.reglasPorVencer}`);
        doc.moveDown();

        // Trabajadores
        doc.fontSize(14).font('Helvetica-Bold').text('Trabajadores');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Total trabajadores activos: ${company.workers.length}`);
        doc.moveDown();

        // Detalle de reglas
        doc.fontSize(14).font('Helvetica-Bold').text('Detalle de Reglas de Cumplimiento');
        doc.moveDown(0.5);

        for (const detalle of complianceResult.detalles) {
          const estadoDetalle = detalle.estado;
          const icono = estadoDetalle === 'CUMPLE' ? '✓' : estadoDetalle === 'POR_VENCER' ? '⚠' : '✗';
          doc.fontSize(10).font('Helvetica');
          doc.fillColor(estadoColors[estadoDetalle] || '#000');
          doc.text(`${icono} ${detalle.reglaNombre} (${detalle.tipoDocumento}) - ${detalle.estado}`);
          doc.fillColor('#000');
          if (detalle.observaciones) {
            doc.fontSize(8).font('Helvetica-Oblique').text(`   ${detalle.observaciones}`, { indent: 10 });
          }
          doc.moveDown(0.3);
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica').fillColor('#666');
        doc.text('Documento generado por AcreditaPro - Plataforma de Acreditación Documental', { align: 'center' });

        doc.end();

        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Genera un archivo Excel con el reporte de cumplimiento.
   * Usa ExcelJS para crear el documento con formato profesional.
   */
  async generateComplianceExcel(companyId: string): Promise<string> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        workers: {
          where: { estado: 'ACTIVO' },
          include: {
            documents: {
              where: { estado: 'APROBADO' },
              select: { tipoDocumento: true, fechaVencimiento: true, estado: true },
            },
          },
        },
      },
    });

    if (!company) {
      throw new AppError('Empresa no encontrada', 404, 'COMPANY_NOT_FOUND');
    }

    const complianceResult = await complianceService.evaluateCompany(companyId);

    const reportsDir = path.join(CONFIG.UPLOAD_DIR, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `compliance-${company.rut}-${Date.now()}.xlsx`;
    const filePath = path.join(reportsDir, filename);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AcreditaPro';
    workbook.created = new Date();

    // Hoja de resumen
    const summarySheet = workbook.addWorksheet('Resumen');
    summarySheet.columns = [
      { header: 'Métrica', key: 'metrica', width: 30 },
      { header: 'Valor', key: 'valor', width: 20 },
    ];

    summarySheet.addRow(['Empresa', company.razonSocial]);
    summarySheet.addRow(['RUT', company.rut]);
    summarySheet.addRow(['Estado Global', complianceResult.estadoGlobal]);
    summarySheet.addRow(['Porcentaje Cumplimiento', `${complianceResult.cumplimientoPorcentaje}%`]);
    summarySheet.addRow(['Reglas Totales', complianceResult.totalReglas]);
    summarySheet.addRow(['Reglas Cumplidas', complianceResult.reglasCumplidas]);
    summarySheet.addRow(['Reglas No Cumplidas', complianceResult.reglasNoCumplidas]);
    summarySheet.addRow(['Reglas por Vencer', complianceResult.reglasPorVencer]);
    summarySheet.addRow(['Fecha Generación', new Date().toLocaleDateString('es-CL')]);

    // Dar formato a encabezados
    summarySheet.getRow(1).font = { bold: true, size: 12 };

    // Hoja de detalle de reglas
    const detailSheet = workbook.addWorksheet('Detalle Reglas');
    detailSheet.columns = [
      { header: 'Regla', key: 'regla', width: 30 },
      { header: 'Tipo Documento', key: 'tipo', width: 25 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Obligatorio', key: 'obligatorio', width: 12 },
      { header: 'Observaciones', key: 'observaciones', width: 40 },
    ];

    // Estilo del encabezado
    detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detailSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };

    for (const detalle of complianceResult.detalles) {
      detailSheet.addRow({
        regla: detalle.reglaNombre,
        tipo: detalle.tipoDocumento,
        estado: detalle.estado,
        obligatorio: detalle.obligatorio ? 'Sí' : 'No',
        observaciones: detalle.observaciones || '',
      });
    }

    // Hoja de trabajadores
    const workerSheet = workbook.addWorksheet('Trabajadores');
    workerSheet.columns = [
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'RUT', key: 'rut', width: 20 },
      { header: 'Cargo', key: 'cargo', width: 20 },
      { header: 'Documentos', key: 'documentos', width: 12 },
    ];

    workerSheet.getRow(1).font = { bold: true };
    for (const worker of company.workers) {
      workerSheet.addRow({
        nombre: worker.nombreCompleto,
        rut: worker.rut,
        cargo: worker.cargo || 'No especificado',
        documentos: worker.documents.length,
      });
    }

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  },

  /**
   * Obtiene estadísticas para el dashboard principal del tenant.
   */
  async getDashboardStats(tenantId: string) {
    const [
      activeCompanies,
      activeWorkers,
      pendingDocuments,
      approvedDocuments,
      rejectedDocuments,
    ] = await Promise.all([
      prisma.company.count({ where: { tenantId, estado: 'ACTIVO' } }),
      prisma.worker.count({ where: { company: { tenantId }, estado: 'ACTIVO' } }),
      prisma.document.count({ where: { tenantId, estado: 'PENDIENTE' } }),
      prisma.document.count({ where: { tenantId, estado: 'APROBADO' } }),
      prisma.document.count({ where: { tenantId, estado: 'RECHAZADO' } }),
    ]);

    // Cumplimiento por empresa
    const empresas = await prisma.company.findMany({
      where: { tenantId, estado: 'ACTIVO' },
      select: { id: true, razonSocial: true },
    });

    let totalCompliance = 0;
    let companiesEvaluated = 0;
    const cumplimientoPorEmpresa: Array<{ empresa: string; porcentaje: number; color: string }> = [];

    const colores = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    for (let i = 0; i < empresas.length; i++) {
      const company = empresas[i];
      try {
        const result = await complianceService.evaluateCompany(company.id);
        totalCompliance += result.cumplimientoPorcentaje;
        companiesEvaluated++;
        cumplimientoPorEmpresa.push({
          empresa: company.razonSocial,
          porcentaje: result.cumplimientoPorcentaje,
          color: colores[i % colores.length],
        });
      } catch {
        // Ignorar errores de evaluación
      }
    }

    const promedioCumplimiento = companiesEvaluated > 0
      ? Math.round(totalCompliance / companiesEvaluated)
      : 0;

    // Documentos por estado
    const documentosPorEstado = [
      { estado: 'APROBADO', cantidad: approvedDocuments, color: '#22c55e' },
      { estado: 'PENDIENTE', cantidad: pendingDocuments, color: '#f59e0b' },
      { estado: 'RECHAZADO', cantidad: rejectedDocuments, color: '#ef4444' },
    ];

    // Últimas alertas
    const ultimasAlertas = await prisma.alert.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        document: { select: { id: true, nombreArchivo: true, tipoDocumento: true } },
        worker: { select: { id: true, nombreCompleto: true } },
        company: { select: { id: true, razonSocial: true } },
      },
    });

    return {
      empresasActivas: activeCompanies,
      trabajadoresAcreditados: activeWorkers,
      documentosVigentes: approvedDocuments,
      cumplimientoGlobal: promedioCumplimiento,
      cumplimientoPorEmpresa,
      tendenciaMensual: [],
      documentosPorEstado,
      ultimasAlertas,
    };
  },
};
