import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { authController } from '../controllers/auth.controller';
import { companyController } from '../controllers/company.controller';
import { workerController } from '../controllers/worker.controller';
import { documentController } from '../controllers/document.controller';
import { complianceController } from '../controllers/compliance.controller';
import { alertController } from '../controllers/alert.controller';
import { dashboardController } from '../controllers/dashboard.controller';
import { aiController } from '../controllers/ai.controller';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// ============================================================
// Schemas de validación
// ============================================================

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  tenantId: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

const createCompanySchema = z.object({
  razonSocial: z.string().min(1, 'Razón social requerida'),
  rut: z.string().min(1, 'RUT requerido'),
  giro: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  correo: z.string().email('Correo inválido').optional().or(z.literal('')),
  representanteLegal: z.string().optional(),
});

const updateCompanySchema = z.object({
  razonSocial: z.string().optional(),
  giro: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  correo: z.string().email('Correo inválido').optional().or(z.literal('')),
  representanteLegal: z.string().optional(),
});

const createWorkerSchema = z.object({
  companyId: z.string().uuid('ID de empresa inválido'),
  nombreCompleto: z.string().min(1, 'Nombre completo requerido'),
  rut: z.string().min(1, 'RUT requerido'),
  fechaNacimiento: z.string().optional(),
  cargo: z.string().optional(),
  correo: z.string().email('Correo inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
});

const updateWorkerSchema = z.object({
  nombreCompleto: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  cargo: z.string().optional(),
  correo: z.string().email('Correo inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
});

// ============================================================
// Auth Routes - /api/auth
// ============================================================

router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/refresh', validate(refreshSchema), authController.refresh);
router.post('/auth/change-password', verifyToken, validate(changePasswordSchema), authController.changePassword);

// ============================================================
// Company Routes - /api/companies (requieren auth)
// ============================================================

router.get('/companies', verifyToken, companyController.list);
router.get('/companies/:id', verifyToken, companyController.getById);
router.post('/companies', verifyToken, requireRole('ADMIN'), validate(createCompanySchema), auditLog, companyController.create);
router.put('/companies/:id', verifyToken, requireRole('ADMIN'), validate(updateCompanySchema), auditLog, companyController.update);
router.patch('/companies/:id/block', verifyToken, requireRole('ADMIN'), auditLog, companyController.block);

// ============================================================
// Worker Routes - /api/workers (requieren auth)
// ============================================================

router.get('/workers', verifyToken, workerController.list);
router.get('/workers/:id', verifyToken, workerController.getById);
router.post('/workers', verifyToken, requireRole('ADMIN', 'REVISOR'), validate(createWorkerSchema), auditLog, workerController.create);
router.put('/workers/:id', verifyToken, requireRole('ADMIN', 'REVISOR'), validate(updateWorkerSchema), auditLog, workerController.update);
router.patch('/workers/:id/block', verifyToken, requireRole('ADMIN'), auditLog, workerController.block);

// ============================================================
// Document Routes - /api/documents (requieren auth)
// ============================================================

router.post('/documents/upload', verifyToken, requireRole('ADMIN', 'REVISOR', 'CONTRATISTA'), auditLog, documentController.upload);
router.get('/documents', verifyToken, documentController.list);
router.get('/documents/expiring', verifyToken, documentController.getExpiring);
router.get('/documents/expired', verifyToken, documentController.getExpired);
router.get('/documents/:id', verifyToken, documentController.getById);
router.post('/documents/:id/review', verifyToken, requireRole('ADMIN', 'REVISOR'), auditLog, documentController.review);

// ============================================================
// Compliance Routes - /api/compliance (requieren auth)
// ============================================================

router.get('/compliance/worker/:workerId', verifyToken, complianceController.evaluateWorker);
router.get('/compliance/company/:companyId', verifyToken, complianceController.evaluateCompany);
router.get('/compliance/contract/:contractId', verifyToken, complianceController.evaluateContract);
router.get('/compliance/report/:type/:id', verifyToken, complianceController.generateReport);

// ============================================================
// Alert Routes - /api/alerts (requieren auth)
// ============================================================

router.get('/alerts', verifyToken, alertController.list);
router.patch('/alerts/:id/read', verifyToken, alertController.markAsRead);

// ============================================================
// Dashboard Routes - /api/dashboard (requieren auth)
// ============================================================

router.get('/dashboard/stats', verifyToken, dashboardController.stats);

// ============================================================
// AI Routes - /api/ai (requieren auth)
// ============================================================

router.post('/ai/classify', verifyToken, aiController.classify);
router.post('/ai/extract', verifyToken, aiController.extract);
router.post('/ai/chat', verifyToken, aiController.chat);

export default router;
