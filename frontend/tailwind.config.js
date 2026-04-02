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
        // iOS System Colors
        ios: {
          red: '#FF3B30',
          orange: '#FF9500',
          yellow: '#FFCC00',
          green: '#34C759',
          teal: '#5AC8FA',
          blue: '#007AFF',
          indigo: '#5856D6',
          purple: '#AF52DE',
          pink: '#FF2D55',
          gray: '#8E8E93',
          gray2: '#AEAEB2',
          gray3: '#C7C7CC',
          gray4: '#D1D1D6',
          gray5: '#E5E5EA',
          gray6: '#F2F2F7',
        },
        // Light theme tokens (iOS-aligned)
        light: {
          background: '#F2F2F7', // iOS systemGroupedBackground
          surface: '#FFFFFF', // iOS secondarySystemGroupedBackground
          card: '#FFFFFF', // White cards on gray background (iOS Settings style)
          cardHover: '#F2F2F7',
          border: '#D1D1D6', // iOS separator (gray4) — visible contrast
          borderSubtle: '#E5E5EA', // iOS gray5
          input: '#FFFFFF',
          inputBorder: '#D1D1D6',
          primary: '#1C1C1E', // iOS label
          secondary: '#3C3C43', // iOS secondaryLabel
          muted: '#8E8E93', // iOS systemGray
          accent: '#E50914', // Netflix red
          accentHover: '#c70000',
          accentLight: '#ffe0de',
          text: '#1C1C1E', // iOS label
          textSecondary: '#3C3C43', // iOS secondaryLabel
          textMuted: '#8E8E93', // iOS systemGray
          textInverse: '#ffffff',
          glassBg: 'rgba(255, 255, 255, 0.7)',
          glassBorder: 'rgba(60, 60, 67, 0.12)', // iOS separator opacity
        },
        // Dark theme tokens (iOS-aligned)
        dark: {
          background: '#000000', // iOS systemBackground (pure black for OLED)
          surface: '#1C1C1E', // iOS secondarySystemBackground
          card: '#1C1C1E', // iOS secondarySystemGroupedBackground
          cardHover: '#2C2C2E', // iOS tertiarySystemBackground
          border: '#38383A', // iOS separator dark
          borderSubtle: '#2C2C2E',
          input: '#1C1C1E',
          inputBorder: '#38383A',
          primary: '#ffffff',
          secondary: '#EBEBF5', // iOS secondaryLabel dark (99% opacity)
          muted: '#8E8E93', // iOS systemGray
          accent: '#E50914', // Netflix red
          accentHover: '#ff6b66',
          accentLight: '#5c0000',
          text: '#ffffff',
          textSecondary: '#EBEBF5', // iOS secondaryLabel dark
          textMuted: '#8E8E93', // iOS systemGray
          textInverse: '#1C1C1E',
          glassBg: 'rgba(28, 28, 30, 0.7)',
          glassBorder: 'rgba(255, 255, 255, 0.15)',
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
