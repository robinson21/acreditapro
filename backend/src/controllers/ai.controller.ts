import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { documentService } from '../services/document.service';
import { AppError } from '../middleware/errorHandler';

/**
 * Controlador de servicios de IA.
 * Clasificación, extracción de metadatos y chat asistente.
 */
export const aiController = {
  /**
   * POST /api/ai/classify
   * Clasifica un documento basado en su texto.
   * Body: { documentId: string } o { text: string }
   */
  async classify(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId, text } = req.body;

      let textToClassify = text;

      if (documentId) {
        // Obtener texto del OCR del documento
        await documentService.getById(documentId);
        const ocrJob = await prisma.ocrJob.findFirst({
          where: { documentId, estado: 'COMPLETADO' },
          orderBy: { createdAt: 'desc' },
        });
        if (!ocrJob?.txtExtraido || typeof ocrJob.txtExtraido === 'string') {
          textToClassify = (ocrJob?.txtExtraido as any)?.texto || '';
        } else {
          textToClassify = (ocrJob.txtExtraido as any)?.texto || '';
        }

        if (!textToClassify) {
          // Si no hay OCR, procesar ahora
          const { ocrService } = require('../services/ocr.service');
          await ocrService.processDocument(documentId);
          const newOcrJob = await prisma.ocrJob.findFirst({
            where: { documentId, estado: 'COMPLETADO' },
            orderBy: { createdAt: 'desc' },
          });
          textToClassify = (newOcrJob?.txtExtraido as any)?.texto || '';
        }
      }

      if (!textToClassify) {
        throw new AppError('No hay texto para clasificar. Proporcione texto o un documentId con OCR completado.', 400, 'NO_TEXT');
      }

      const result = await aiService.classifyDocument(textToClassify);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/ai/extract
   * Extrae metadatos de un documento.
   * Body: { documentId: string } o { text: string }
   */
  async extract(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId, text } = req.body;

      let textToExtract = text;

      if (documentId) {
        const ocrJob = await prisma.ocrJob.findFirst({
          where: { documentId, estado: 'COMPLETADO' },
          orderBy: { createdAt: 'desc' },
        });
        textToExtract = (ocrJob?.txtExtraido as any)?.texto || '';

        if (!textToExtract) {
          const { ocrService } = require('../services/ocr.service');
          await ocrService.processDocument(documentId);
          const newOcrJob = await prisma.ocrJob.findFirst({
            where: { documentId, estado: 'COMPLETADO' },
            orderBy: { createdAt: 'desc' },
          });
          textToExtract = (newOcrJob?.txtExtraido as any)?.texto || '';
        }
      }

      if (!textToExtract) {
        throw new AppError('No hay texto para extraer metadatos.', 400, 'NO_TEXT');
      }

      const result = await aiService.extractMetadata(textToExtract);
      res.json({ ok: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/ai/chat
   * Chat conversacional con el asistente IA.
   * Body: { query: string, context?: string }
   */
  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, context } = req.body;

      if (!query) {
        throw new AppError('La consulta es requerida', 400, 'QUERY_REQUIRED');
      }

      const result = await aiService.chat(query, context);
      res.json({ ok: true, data: { respuesta: result } });
    } catch (error) {
      next(error);
    }
  },
};

// Import necesario para consultas OCR en este controlador
import prisma from '../config/database';
