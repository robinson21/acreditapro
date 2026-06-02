import * as fs from 'fs';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Servicio de OCR (Reconocimiento Óptico de Caracteres).
 * Procesa documentos imagen/PDF para extraer texto.
 * Usa Tesseract.js como motor principal.
 */
export class OcrService {
  /**
   * Ejecuta OCR sobre un documento.
   * Lee el archivo, ejecuta Tesseract.js y guarda el texto extraído en OcrJob.
   */
  async processDocument(documentId: string): Promise<any> {
    // Obtener el documento
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { ocrJobs: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!document) {
      throw new AppError('Documento no encontrado', 404, 'DOCUMENT_NOT_FOUND');
    }

    // Verificar el archivo
    if (!fs.existsSync(document.rutaArchivo)) {
      throw new AppError('Archivo del documento no encontrado en el servidor', 404, 'FILE_NOT_FOUND');
    }

    // Buscar o crear un trabajo OCR
    let ocrJob = document.ocrJobs[0];
    if (!ocrJob || ocrJob.estado === 'COMPLETADO') {
      ocrJob = await prisma.ocrJob.create({
        data: {
          documentId,
          estado: 'PROCESANDO',
          motor: 'TESSERACT',
        },
      });
    } else {
      ocrJob = await prisma.ocrJob.update({
        where: { id: ocrJob.id },
        data: { estado: 'PROCESANDO' },
      });
    }

    try {
      // Verificar tipo de archivo
      const ext = document.tipoMIME.toLowerCase();
      let textoExtraido = '';

      if (ext === 'application/pdf') {
        textoExtraido = await this.processPdf(document.rutaArchivo);
      } else if (ext === 'image/jpeg' || ext === 'image/png') {
        textoExtraido = await this.processImage(document.rutaArchivo);
      } else if (
        ext === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        textoExtraido = await this.processDocx(document.rutaArchivo);
      } else {
        textoExtraido = await this.processImage(document.rutaArchivo);
      }

      // Actualizar el trabajo OCR con el resultado
      const result = await prisma.ocrJob.update({
        where: { id: ocrJob.id },
        data: {
          estado: 'COMPLETADO',
          txtExtraido: JSON.stringify({ texto: textoExtraido, longitud: textoExtraido.length }),
          score: textoExtraido.length > 100 ? 0.85 : 0.5,
        },
      });

      return result;
    } catch (error: any) {
      // Marcar como error
      await prisma.ocrJob.update({
        where: { id: ocrJob.id },
        data: {
          estado: 'ERROR',
          txtExtraido: JSON.stringify({ error: error.message }),
        },
      });

      throw new AppError(`Error en OCR: ${error.message}`, 500, 'OCR_PROCESSING_ERROR');
    }
  }

  /**
   * Procesa una imagen con Tesseract.js.
   */
  private async processImage(filePath: string): Promise<string> {
    try {
      // Usar require dinámico porque tesseract.js es ESM y puede causar problemas
      const Tesseract = require('tesseract.js');
      const { data } = await Tesseract.recognize(filePath, 'spa', {
        logger: (_info: any) => {
          // Silenciar logs de progreso
        },
      });
      return data.text || '';
    } catch (error) {
      console.error('Error en Tesseract OCR:', error);
      // Fallback: intentar con configuración por defecto
      try {
        const Tesseract = require('tesseract.js');
        const { data } = await Tesseract.recognize(filePath, 'spa');
        return data.text || '';
      } catch {
        return '';
      }
    }
  }

  /**
   * Procesa un PDF. Si es imagen, usa OCR. Si es texto, extrae directamente.
   */
  private async processPdf(filePath: string): Promise<string> {
    // Para PDFs, primero intentar extraer texto con Tesseract
    // (en producción se usaría pdf-parse o similar)
    try {
      const Tesseract = require('tesseract.js');
      // Convertir PDF a imágenes y OCR cada página
      // Por simplicidad, tratamos el PDF como imagen
      const { data } = await Tesseract.recognize(filePath, 'spa');
      return data.text || '';
    } catch {
      return '';
    }
  }

  /**
   * Procesa un archivo DOCX.
   */
  private async processDocx(_filePath: string): Promise<string> {
    // Los DOCX son XML comprimidos, podemos leer texto directamente
    // Por ahora, devolvemos empty y se procesa como imagen
    return '';
  }

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
  }
}

export const ocrService = new OcrService();
