// PostCSS config para procesar Tailwind CSS y añadir prefijos automáticos
export default {
  plugins: {
    tailwindcss: {},    // Procesa las directivas @tailwind
    autoprefixer: {},   // Añade prefijos -webkit-, -moz-, etc.
  },
};
