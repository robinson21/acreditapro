import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno según el modo
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // Base path para GitHub Pages (sub-ruta /acreditapro/)
    base: env.VITE_BASE_URL || '/',

    plugins: [react()],

    // Resolución de alias para imports absolutos (ej: @/components/...)
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@components": resolve(__dirname, "./src/components"),
        "@pages": resolve(__dirname, "./src/pages"),
        "@layouts": resolve(__dirname, "./src/layouts"),
        "@hooks": resolve(__dirname, "./src/hooks"),
        "@stores": resolve(__dirname, "./src/stores"),
        "@services": resolve(__dirname, "./src/services"),
        "@utils": resolve(__dirname, "./src/utils"),
        "@types": resolve(__dirname, "./src/types"),
        "@assets": resolve(__dirname, "./src/assets"),
      },
    },

    // Servidor de desarrollo
    server: {
      port: 5173,
      host: true, // Permitir conexiones desde el contenedor Docker
      allowedHosts: true, // Permitir túneles externos (localhost.run, ngrok, etc.)
      strictPort: false,

      // Proxy inverso hacia el backend
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:3001",
          changeOrigin: true,
          secure: false,
          // Reescribir la ruta si es necesario
          // rewrite: (path) => path.replace(/^\/api/, ""),
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.error(
                "[Proxy Error] No se pudo conectar con el backend:",
                err.message
              );
            });
          },
        },
        // Proxy para archivos estáticos subidos
        "/uploads": {
          target: env.VITE_API_URL || "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },

    // Configuración de build para producción
    build: {
      outDir: "dist",
      sourcemap: mode !== "production",
      // Minimización y optimización
      minify: "esbuild",
      cssMinify: true,
      rollupOptions: {
        output: {
          // Dividir chunks para mejor caching
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            ui: ["lucide-react", "framer-motion", "sonner"],
            charts: ["recharts"],
            pdf: ["pdfjs-dist"],
          },
        },
      },
      // Advertencia sobre tamaño de chunks
      chunkSizeWarningLimit: 1000,
    },

    // Variables de entorno expuestas al frontend
    define: {
      __APP_VERSION__: JSON.stringify(env.APP_VERSION || "1.0.0"),
    },
  };
});
