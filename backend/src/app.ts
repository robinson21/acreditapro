import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { CONFIG } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// ============================================================
// Seguridad con Helmet
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Deshabilitado para APIs REST
}));

// ============================================================
// CORS
// ============================================================
app.use(cors({
  origin: CONFIG.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================================
// Logging con Morgan
// ============================================================
if (CONFIG.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================================
// Parseo de JSON y URL-encoded
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// Rate Limiting
// ============================================================
const limiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT_WINDOW * 60 * 1000, // convertir minutos a ms
  max: CONFIG.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: 'Demasiadas solicitudes. Intente nuevamente más tarde.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

app.use('/api/', limiter);

// ============================================================
// Archivos estáticos (uploads)
// ============================================================
app.use('/uploads', express.static(path.join(CONFIG.UPLOAD_DIR)));

// ============================================================
// Rutas de la API
// ============================================================
app.use('/api', routes);

// ============================================================
// Health check
// ============================================================
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    status: 'running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================================
// Manejo de rutas no encontradas
// ============================================================
app.use('/api/*', notFoundHandler);

// ============================================================
// Middleware de manejo global de errores
// ============================================================
app.use(errorHandler);

export default app;
