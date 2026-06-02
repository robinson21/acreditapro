/// <reference types="vite/client" />

// Tipos para variables de entorno de Vite
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_UPLOAD_MAX_SIZE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
