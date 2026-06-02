/** @type {import('tailwindcss').Config} */

// Paleta de colores corporativa AcreditaPro
// Azul profundo -> confianza y profesionalismo
// Verde éxito -> acreditaciones y documentos aprobados
// Ámbar advertencia -> pendientes y por vencer
// Rojo alerta -> vencidos y rechazados

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  // Modo oscuro basado en clase (para alternar manualmente)
  darkMode: "class",

  theme: {
    extend: {
      // === Paleta de colores corporativa ===
      colors: {
        // Primario: Azul corporativo
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#1e40af", // Color principal
          600: "#1e3a8a",
          700: "#1e3380",
          800: "#172554",
          900: "#0f172a",
        },
        // Secundario: Azul acero
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#475569",
          600: "#334155",
          700: "#1e293b",
          800: "#0f172a",
          900: "#020617",
        },
        // Éxito: Verde para documentos acreditados
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#16a34a",
          600: "#15803d",
          700: "#166534",
          800: "#14532d",
          900: "#052e16",
        },
        // Advertencia: Ámbar para pendientes
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#d97706",
          600: "#b45309",
          700: "#92400e",
          800: "#78350f",
          900: "#451a03",
        },
        // Peligro: Rojo para vencidos/rechazados
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#dc2626",
          600: "#b91c1c",
          700: "#991b1b",
          800: "#7f1d1d",
          900: "#450a0a",
        },
      },

      // === Tipografía ===
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },

      // === Animaciones personalizadas ===
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },

      // === Bordes y sombras ===
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
        "card-hover":
          "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
        modal: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      },

      // === Espaciado del layout ===
      spacing: {
        "navbar": "4rem",
        "sidebar": "16rem",
        "sidebar-collapsed": "4rem",
      },

      // === Tamaños de pantalla (breakpoints) ===
      screens: {
        xs: "375px",
        tablet: "640px",
        laptop: "1024px",
        desktop: "1280px",
      },
    },
  },

  plugins: [
    // Plugin oficial para estilos de formularios
    require("@tailwindcss/forms")({
      strategy: "class", // Solo aplicar con la clase 'form-*'
    }),
    // Plugin para tipografía rica (prosa)
    require("@tailwindcss/typography"),
  ],
};
