/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0F172A',       // Slate Escuro (Fundo principal)
        'card-bg': '#1E293B',       // Slate Container (Cards e Caixas)
        'win-teal': '#008080',      // Teal Win95 (Botões e Destaques Principais)
        'cyber-cyan': '#00F0FF',    // Cyan Neon (QR Code, Highlights e Ativos)
        'win-gray': '#C0C0C0',      // Cinza Win95 (Bordas Industriais)
        'status-amber': '#FFB800',  // Amarelo Alerta (Bateria Carregando)
        'status-green': '#10B981',  // Verde Emerald (Item No Carro / Check OK)
      },
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'win95-out': 'inset 1px 1px 0px #ffffff, inset -1px -1px 0px #404040',
        'win95-in': 'inset 1px 1px 0px #404040, inset -1px -1px 0px #ffffff',
        'neon-cyan': '0 0 12px rgba(0, 240, 255, 0.4)',
        'neon-teal': '0 0 10px rgba(0, 128, 128, 0.5)',
      }
    },
  },
  plugins: [],
}
