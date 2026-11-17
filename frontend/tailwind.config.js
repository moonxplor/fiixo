/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fiixo: {
          purple: "#7955F5",
          pink: "#FF579A",
          yellow: "#FFD65A",
          blue: "#477BFF",
          bg: "#F8F5FF",
          plum: "#241A35",
          dark: "#130E1C",
          surface: "#1E162D",
          card: "#FFFFFF",
          border: "#E7E0F5"
        }
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        pixel: ["'Press Start 2P'", "monospace"],
        vt323: ["'VT323'", "monospace"]
      }
    },
  },
  plugins: [],
}
