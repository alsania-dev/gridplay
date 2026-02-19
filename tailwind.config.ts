import { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          50: '#e6fff0',
          100: '#b3ffd6',
          200: '#80ffbc',
          300: '#4dffa2',
          400: '#1aff88',
          500: '#00ff88', // Main accent - neon green
          600: '#00cc6a',
          700: '#009952',
          800: '#006635',
          900: '#00331a',
        },
        // Navy/Dark blue - professional sports feel
        navy: {
          50: '#e7e9ef',
          100: '#c4c9d9',
          200: '#9da5c0',
          300: '#7681a7',
          400: '#586694',
          500: '#3a4b81',
          600: '#33427a',
          700: '#2b3871',
          800: '#1e2751', // Main navy
          900: '#0f172a', // Darker navy
          950: '#080d19',
        },
        // Background colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        muted: "var(--muted)",
        border: "var(--border)",
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 15px rgba(0, 255, 136, 0.3)',
        'glow-lg': '0 0 30px rgba(0, 255, 136, 0.4)',
        'glow-sm': '0 0 8px rgba(0, 255, 136, 0.2)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(to right, rgba(0, 255, 136, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 255, 136, 0.1) 1px, transparent 1px)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(0, 255, 136, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(0, 255, 136, 0.5)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
