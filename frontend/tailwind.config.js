/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Netflix brand color - Primary accent
        netflix: {
          50: '#fff1f0',
          100: '#ffe0de',
          200: '#ffc7c2',
          300: '#ffa09a',
          400: '#ff6b66',
          500: '#E50914', // Netflix signature red
          600: '#c70000',
          700: '#a00000',
          800: '#7a0000',
          900: '#5c0000',
          950: '#3d0000',
        },
        // Cinematic grays - Netflix-inspired neutral palette
        cinematic: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e8e8e8',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#3d3d3d',
          800: '#2a2a2a',
          850: '#1f1f1f',
          900: '#141414', // Netflix background dark
          950: '#0a0a0a',
        },
        // Semantic colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Light theme tokens
        light: {
          background: '#ffffff',
          surface: '#fafafa',
          card: '#f5f5f5',
          cardHover: '#e8e8e8',
          border: '#e8e8e8',
          borderSubtle: '#f5f5f5',
          input: '#fafafa',
          inputBorder: '#e8e8e8',
          primary: '#0f172a',
          secondary: '#525252',
          muted: '#737373',
          accent: '#E50914', // Netflix red
          accentHover: '#c70000',
          accentLight: '#ffe0de',
          text: '#0f172a',
          textSecondary: '#525252',
          textMuted: '#737373',
          textInverse: '#ffffff',
          glassBg: 'rgba(255, 255, 255, 0.7)',
          glassBorder: 'rgba(0, 0, 0, 0.1)',
        },
        // Dark theme tokens
        dark: {
          background: '#141414', // Netflix dark
          surface: '#1f1f1f',
          card: '#2a2a2a',
          cardHover: '#3d3d3d',
          border: '#3d3d3d',
          borderSubtle: '#2a2a2a',
          input: '#2a2a2a',
          inputBorder: '#3d3d3d',
          primary: '#ffffff',
          secondary: '#d4d4d4',
          muted: '#a3a3a3',
          accent: '#E50914', // Netflix red
          accentHover: '#ff6b66',
          accentLight: '#5c0000',
          text: '#ffffff',
          textSecondary: '#d4d4d4',
          textMuted: '#a3a3a3',
          textInverse: '#0f172a',
          glassBg: 'rgba(31, 31, 31, 0.7)',
          glassBorder: 'rgba(255, 255, 255, 0.1)',
        },
      },
      fontFamily: {
        sans: ['System'],
        mono: ['Menlo', 'Monaco', 'Courier New'],
      },
      fontSize: {
        xs: ['13px', { lineHeight: '18px', letterSpacing: '0.01em' }],
        sm: ['15px', { lineHeight: '20px', letterSpacing: '0.005em' }],
        base: ['17px', { lineHeight: '22px', letterSpacing: '-0.005em' }],
        lg: ['19px', { lineHeight: '24px', letterSpacing: '-0.01em' }],
        xl: ['22px', { lineHeight: '28px', letterSpacing: '-0.015em' }],
        '2xl': ['28px', { lineHeight: '34px', letterSpacing: '-0.02em' }],
        '3xl': ['34px', { lineHeight: '41px', letterSpacing: '-0.025em' }],
        '4xl': ['40px', { lineHeight: '48px', letterSpacing: '-0.03em' }],
        '5xl': ['52px', { lineHeight: '60px', letterSpacing: '-0.035em' }],
      },
      borderRadius: {
        // Apple-style squircle-inspired radii (enhanced for smoother corners)
        lg: '10px', // Small buttons, chips
        xl: '14px', // Cards, inputs (enhanced from 12px)
        '2xl': '18px', // Large cards (enhanced from 16px)
        '3xl': '24px', // Modals, sheets
        '4xl': '28px', // Large containers
      },
    },
  },
  plugins: [],
};
