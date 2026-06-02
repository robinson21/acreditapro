import * as crypto from 'crypto';
import * as fs from 'fs';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';

interface DocumentFilters {
  estado?: string;
  categoria?: string;
  tipoDocumento?: string;
  companyId?: string;
  workerId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

/**
 * Servicio de gestión de documentos.
 * Maneja subida, listado, revisión, y monitoreo de vencimientos.
 */
export const documentService = {
  /**
   * Guarda un archivo en el sistema de archivos y crea el registro Document y DocumentVersion.
   * Programa OCR para procesamiento posterior.
   */
  async upload(
    file: Express.Multer.File,
    metadata: {
      tenantId: string;
      companyId: string;
      categoria: string;
      tipoDocumento: string;
      workerId?: string;
      contractId?: string;
      fechaEmision?: string;
      fechaVencimiento?: string;
      numeroDocumento?: string;
      organismoEmisor?: string;
    },
    userId: string
  ) {
    // Calcular hash SHA256 del archivo
    const fileBuffer = fs.readFileSync(file.path);
    const hash = this.generateHash(fileBuffer);

    // Verificar si ya existe un documento con el mismo hash en el mismo tenant
    const existingDoc = await prisma.document.findFirst({
      where: {
        hash,
        tenantId: metadata.tenantId,
      },
      include: { versiones: { orderBy: { version: 'desc' }, take: 1 } },
    });

    let document;
    let versionNumber = 1;

    if (existingDoc) {
      // Actualizar versión
      document = existingDoc;
      const latestVersion = existingDoc.versiones[0];
      versionNumber = latestVersion ? latestVersion.version + 1 : 1;
    } else {
      // Crear nuevo documento
      document = await prisma.document.create({
        data: {
          tenantId: metadata.tenantId,
          companyId: metadata.companyId,
          workerId: metadata.workerId || null,
          contractId: metadata.contractId || null,
          categoria: metadata.categoria as any,
          tipoDocumento: metadata.tipoDocumento as any,
          nombreArchivo: file.originalname,
          rutaArchivo: file.path,
          tamanoBytes: file.size,
          tipoMIME: file.mimetype,
          hash,
          fechaEmision: metadata.fechaEmision ? new Date(metadata.fechaEmision) : null,
          fechaVencimiento: metadata.fechaVencimiento ? new Date(metadata.fechaVencimiento) : null,
          numeroDocumento: metadata.numeroDocumento || null,
          organismoEmisor: metadata.organismoEmisor || null,
        },
      });
    }

    // Crear versión del documento
    const version = await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        version: versionNumber,
        nombreArchivo: file.originalname,
        rutaArchivo: file.path,
        tamanoBytes: file.size,
        tipoMIME: file.mimetype,
        hash,
        subidoPorId: userId,
      },
    });

    // Programar OCR (asíncrono, no bloqueante)
    this.scheduleOcr(document.id, file.path).catch((err) => {
      console.error('Error al programar OCR:', err);
    });

    return { document, version };
  },

  /**
   * Lista documentos con filtros avanzados.
   * Filtros: estado, categoria, tipo, empresa, trabajador, fechas.
   */
  async list(tenantId: string, filters: DocumentFilters = {}) {
    const {
      estado,
      categoria,
      tipoDocumento,
      companyId,
      workerId,
      fechaDesde,
      fechaHasta,
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.DocumentWhereInput = {
      tenantId,
    };

    if (estado) where.estado = estado as any;
    if (categoria) where.categoria = categoria as any;
    if (tipoDocumento) where.tipoDocumento = tipoDocumento as any;
    if (companyId) where.companyId = companyId;
    if (workerId) where.workerId = workerId;
    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt.gte = new Date(fechaDesde);
      if (fechaHasta) where.createdAt.lte = new Date(fechaHasta);
    }

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: { id: true, razonSocial: true, rut: true },
          },
          worker: {
            select: { id: true, nombreCompleto: true, rut: true },
          },
          revisadoPor: {
            select: { id: true, nombre: true, apellido: true },
          },
          versiones: {
            orderBy: { version: 'desc' },
            take: 1,
          },
          _count: {
            select: { versiones: true, revisiones: true },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return {
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Obtiene un documento por su ID con todas sus versiones y revisiones.
   */
  async getById(id: string) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, razonSocial: true, rut: true },
        },
        worker: {
          select: { id: true, nombreCompleto: true, rut: true, cargo: true },
        },
        contract: {
          select: { id: true, numeroContrato: true },
        },
        versiones: {
          orderBy: { version: 'desc' },
          include: {
            subidoPor: {
              select: { id: true, nombre: true, apellido: true, email: true },
            },
          },
        },
        revisiones: {
          orderBy: { createdAt: 'desc' },
          include: {
            revisor: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
        revisadoPor: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    if (!document) {
      throw new AppError('Documento no encontrado', 404, 'DOCUMENT_NOT_FOUND');
    }

    return document;
  },

  /**
   * Revisa un documento: lo aprueba o rechaza, crea DocumentReview,
   * actualiza el estado y genera alertas según corresponda.
   */
  async review(documentId: string, userId: string, decision: 'APROBADO' | 'RECHAZADO', observaciones?: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { company: true, worker: true },
    });

    if (!document) {
      throw new AppError('Documento no encontrado', 404, 'DOCUMENT_NOT_FOUND');
    }

    // Crear la revisión
    const review = await prisma.documentReview.create({
      data: {
        documentId,
        revisorId: userId,
        decision,
        observaciones,
      },
    });

    // Actualizar estado del documento
    const updateData: any = {
      estado: decision === 'APROBADO' ? 'APROBADO' : 'RECHAZADO',
      estadoAcreditacion: decision === 'APROBADO' ? 'ACREDITADO' : 'NO_ACREDITADO',
      revisadoPorId: userId,
      fechaRevision: new Date(),
    };

    await prisma.document.update({
      where: { id: documentId },
      data: updateData,
    });

    return review;
  },

  /**
   * Obtiene documentos próximos a vencer dentro de X días.
   */
  async getExpiring(tenantId: string, dias: number = 30) {
    const now = new Date();
    const fechaLimite = new Date(now.getTime() + dias * 24 * 60 * 60 * 1000);

    const documents = await prisma.document.findMany({
      where: {
        tenantId,
        fechaVencimiento: {
          gte: now,
          lte: fechaLimite,
        },
        estado: 'APROBADO',
      },
      include: {
        company: { select: { id: true, razonSocial: true } },
        worker: { select: { id: true, nombreCompleto: true } },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });

    return documents;
  },

  /**
   * Obtiene documentos ya vencidos.
   */
  async getExpired(tenantId: string) {
    const now = new Date();

    const documents = await prisma.document.findMany({
      where: {
        tenantId,
        fechaVencimiento: {
          lte: now,
        },
        estado: { in: ['APROBADO', 'PENDIENTE', 'REVISION'] },
      },
      include: {
        company: { select: { id: true, razonSocial: true } },
        worker: { select: { id: true, nombreCompleto: true } },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });

    return documents;
  },

  /**
   * Genera hash SHA256 de un buffer de archivo.
   */
  generateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  },

  /**
   * Programa un trabajo OCR para el documento.
   */
  async scheduleOcr(documentId: string, _filePath: string) {
    await prisma.ocrJob.create({
      data: {
        documentId,
        estado: 'PENDIENTE',
        motor: 'TESSERACT',
      },
    });
  },
};
