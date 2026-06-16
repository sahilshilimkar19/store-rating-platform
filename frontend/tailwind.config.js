/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Arial',
          'sans-serif',
        ],
      },
      // Design tokens (mirror the design system's :root). Existing indigo/gray
      // utilities already resolve to these exact hexes; these add semantic names.
      colors: {
        brand: {
          DEFAULT: '#4F46E5',
          hover: '#4338CA',
          tint: '#EEF2FF',
        },
        star: '#F59E0B',
        ink: '#111827',
        muted: '#6B7280',
        surface: '#FFFFFF',
        canvas: '#F7F8FA',
        hairline: '#E5E7EB',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06)',
        pop: '0 4px 12px rgba(16,24,40,.08)',
        modal: '0 12px 32px rgba(16,24,40,.12)',
      },
      keyframes: {
        dash: {
          '0%': { strokeDashoffset: '50' },
          '50%': { strokeDashoffset: '14' },
          '100%': { strokeDashoffset: '50' },
        },
        'modal-pop': {
          from: { opacity: '0', transform: 'scale(.96)' },
          to: { opacity: '1', transform: 'none' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'card-rise': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        dash: 'dash 1.4s ease-in-out infinite',
        'modal-pop': 'modal-pop 200ms ease both',
        'toast-in': 'toast-in 200ms ease both',
        'card-rise': 'card-rise 200ms ease both',
        'fade-in': 'fade-in 200ms ease both',
      },
    },
  },
  plugins: [],
};
