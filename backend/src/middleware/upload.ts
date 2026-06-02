import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config';
import { AppError } from './errorHandler';

// Asegurar que el directorio de uploads existe
if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
  fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
}

// Tipos MIME permitidos
const MIME_TYPES_ALLOWED = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
  'image/jpeg',
  'image/png',
];

const EXTENSIONS_ALLOWED = ['.pdf', '.docx', '.xlsx', '.jpg', '.jpeg', '.png'];

/**
 * Configuración de almacenamiento en disco para multer.
 * Genera nombres únicos con timestamp + uuid.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, CONFIG.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const uniqueId = uuidv4().slice(0, 8);
    const sanitizedName = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9áéíóúñü\-_ ]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 60);
    const filename = `${timestamp}-${uniqueId}-${sanitizedName}${ext}`;
    cb(null, filename);
  },
});

/**
 * Filtro de archivos: solo permite PDF, DOCX, XLSX, JPG, PNG.
 */
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMime = MIME_TYPES_ALLOWED.includes(file.mimetype);
  const isValidExt = EXTENSIONS_ALLOWED.includes(ext);

  if (isValidMime && isValidExt) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Tipo de archivo no permitido. Solo se aceptan: PDF, DOCX, XLSX, JPG, PNG',
        400,
        'INVALID_FILE_TYPE'
      )
    );
  }
};

/**
 * Middleware de multer configurado para subir archivos.
 * Límite: 50MB. Almacenamiento en disco con nombre único.
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: CONFIG.MAX_FILE_SIZE,
  },
});

/**
 * Middleware para subir un solo archivo con nombre de campo 'file'.
 */
export const uploadSingle = upload.single('file');

/**
 * Middleware para subir múltiples archivos (máximo 10) con nombre de campo 'files'.
 */
export const uploadMultiple = upload.array('files', 10);

/**
 * Elimina un archivo del disco de forma segura.
 */
export const deleteFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
  }
};
