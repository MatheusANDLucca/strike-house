/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './client/index.html',
    './client/src/**/*.{js,ts,jsx,tsx}',
    '../client/index.html',
    '../client/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0E14',
          surface: '#111622',
          card: '#171F30',
          border: '#2A3654',
          subtle: '#1E293B',
          muted: '#334155',
        },
        brand: {
          primary: '#EF4444',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#DC2626',
          purple: '#A855F7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -5px rgba(239, 68, 68, 0.4)',
        'glow-success': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
        'glow-warning': '0 0 20px -5px rgba(245, 158, 11, 0.3)',
        'glow-danger': '0 0 20px -5px rgba(239, 68, 68, 0.3)',
        'glow-purple': '0 0 20px -5px rgba(168, 85, 247, 0.3)',
      },
    },
  },
  plugins: [],
};
