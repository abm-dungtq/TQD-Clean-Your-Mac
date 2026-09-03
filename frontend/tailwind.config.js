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
        macos: {
          canvas: '#F5F5F7',       // Nền tổng thể cửa sổ macOS
          sidebar: '#ECECF0',      // Nền Sidebar bán trong suốt
          card: '#FFFFFF',         // Thẻ nội dung nổi bật
          subtle: '#F9F9FB',       // Nền phụ, hover item
          border: {
            DEFAULT: '#E5E5EA',    // Đường kẻ phân cách chuẩn Cupertino
            strong: '#D1D1D6',     // Viền nhấn
          },
          blue: {
            DEFAULT: '#007AFF',    // Apple System Blue
            hover: '#0062CC',
            subtle: 'rgba(0, 122, 255, 0.10)',
          },
          indigo: {
            DEFAULT: '#5856D6',    // Apple System Indigo
            subtle: 'rgba(88, 86, 214, 0.10)',
          },
          green: {
            DEFAULT: '#34C759',    // Apple System Green
            subtle: 'rgba(52, 199, 89, 0.12)',
          },
          amber: {
            DEFAULT: '#FF9500',    // Apple System Amber/Orange
            subtle: 'rgba(255, 149, 0, 0.12)',
          },
          red: {
            DEFAULT: '#FF3B30',    // Apple System Red
            subtle: 'rgba(255, 59, 48, 0.10)',
          },
          text: {
            primary: '#1D1D1F',    // 16.0:1 Contrast (AAA)
            secondary: '#515154',  // 7.02:1 Contrast (AAA)
            caption: '#6E6E73',    // 5.34:1 Contrast (AA)
            disabled: '#AEAEB2',
          }
        },
        // Semantic aliases for smooth transition
        void: '#F5F5F7',
        surface: {
          DEFAULT: '#ECECF0',
          card: '#FFFFFF',
          high: '#F9F9FB',
          border: '#E5E5EA',
        },
        cyber: {
          cyan: '#007AFF',
          purple: '#5856D6',
          green: '#34C759',
          amber: '#FF9500',
          red: '#FF3B30',
        },
      },
      fontFamily: {
        hud: ['"Be Vietnam Pro"', '"Inter"', '-apple-system', 'sans-serif'],
        sans: ['"Be Vietnam Pro"', '"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'macos-card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'macos-card-hover': '0 4px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)',
        'macos-button': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'neon-cyan': '0 1px 3px rgba(0, 122, 255, 0.2)',
        'neon-purple': '0 1px 3px rgba(88, 86, 214, 0.2)',
        'neon-green': '0 1px 3px rgba(52, 199, 89, 0.2)',
      },
      borderRadius: {
        'macos': '10px',
        'macos-card': '14px',
        'macos-large': '18px',
      },
    },
  },
  plugins: [],
}
