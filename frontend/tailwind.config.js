/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: '#050505',
        surface: {
          DEFAULT: '#0e0e0e',
          card: '#131313',
          high: '#1c1b1b',
          border: 'rgba(0, 242, 255, 0.15)',
        },
        cyber: {
          cyan: '#00f2ff',
          purple: '#bc13fe',
          green: '#00ff9f',
          amber: '#ffb700',
          red: '#ff0055',
        },
      },
      fontFamily: {
        hud: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Be Vietnam Pro"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 20px -3px rgba(0, 242, 255, 0.35)',
        'neon-purple': '0 0 20px -3px rgba(188, 19, 254, 0.35)',
        'neon-green': '0 0 20px -3px rgba(0, 255, 159, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-spin': 'radarSpin 4s linear infinite',
      },
      keyframes: {
        radarSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
