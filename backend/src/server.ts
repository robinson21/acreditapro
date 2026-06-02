import app from './app';
import { CONFIG } from './config';

/**
 * Punto de entrada de la API AcreditaPro.
 * Inicia el servidor Express en el puerto configurado.
 */
app.listen(CONFIG.PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀  AcreditaPro API corriendo en puerto ${CONFIG.PORT}`);
  console.log(`📦  Entorno: ${CONFIG.NODE_ENV}`);
  console.log(`🔗  http://localhost:${CONFIG.PORT}`);
  console.log(`💚  Health: http://localhost:${CONFIG.PORT}/health`);
  console.log('='.repeat(50));
});
