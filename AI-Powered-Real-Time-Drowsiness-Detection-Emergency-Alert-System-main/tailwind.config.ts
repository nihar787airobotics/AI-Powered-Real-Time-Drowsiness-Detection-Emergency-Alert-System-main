import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    colors: {
      background: '#0a0a0a',
      'background-secondary': '#0f0f0f',
      'background-tertiary': '#1a1a1a',
      white: '#ffffff',
      transparent: 'transparent',
      current: 'currentColor',
      gray: {
        '100': '#f3f4f6',
        '200': '#e5e7eb',
        '300': '#d1d5db',
        '400': '#9ca3af',
        '500': '#6b7280',
        '600': '#4b5563',
        '700': '#374151',
        '800': '#1f2937',
        '900': '#111827',
      },
      accent: {
        cyan: '#00f0ff',
        blue: '#0066ff',
        purple: '#8b5cf6',
        green: '#00ff00',
        orange: '#ff6600',
        red: '#ff0000',
      },
    },
    fontFamily: {
      sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      mono: ['var(--font-mono)', 'monospace'],
    },
    extend: {
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.3)',
        'glow-cyan-lg': '0 0 40px rgba(0, 240, 255, 0.5)',
        'glow-blue': '0 0 20px rgba(0, 102, 255, 0.3)',
        'glow-blue-lg': '0 0 40px rgba(0, 102, 255, 0.5)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-purple-lg': '0 0 40px rgba(139, 92, 246, 0.5)',
      },
      backdropBlur: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      animation: {
        pulse: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float-up': 'float-up 6s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 240, 255, 0.6)' },
        },
        'float-up': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
} satisfies Config;
