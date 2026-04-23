/** @type {import('tailwindcss').Config} */
module.exports = {
  /**
   * Content paths tell Tailwind which files to scan
   * for class names so unused styles are purged in production.
   * We scan all .tsx and .ts files in src/ and App.tsx.
   */
  content: [
    './App.tsx',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /**
         * REGEM Brand Colors
         * These extend Tailwind's default palette so we can write:
         * className="bg-primary text-cream"
         * instead of hardcoding hex values in every component.
         */
        primary: '#1A5C38',
        'primary-light': '#2D7A4F',
        'primary-dark': '#0F3D24',
        gold: '#C9A84C',
        'gold-light': '#E8C97A',
        cream: '#F8F9F4',
        'cream-dark': '#EEF0E8',

        // Semantic colors
        danger: '#E53935',
        'danger-light': '#FFEBEE',
        warning: '#F59E0B',
        'warning-light': '#FFFBEB',
        success: '#22C55E',
        'success-light': '#F0FDF4',

        // Text colors
        'text-primary': '#0D1F0F',
        'text-secondary': '#5A6B5C',
        'text-tertiary': '#8FA08F',

        // Dark mode surfaces
        'dark-bg': '#0D1A0F',
        'dark-card': '#1A2B1C',
        'dark-elevated': '#223325',
        'dark-border': '#2A3D2C',
      },
      fontFamily: {
        /**
         * We use the system font stack for performance.
         * Inter will be loaded via expo-font in the app.
         */
        sans: ['Inter', 'System'],
      },
      borderRadius: {
        /**
         * Custom border radius values matching our design system.
         * Use like: className="rounded-card" or "rounded-btn"
         */
        'sm': '6px',
        'md': '10px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '28px',
        'card': '16px',
        'btn': '12px',
      },
    },
  },
  plugins: [],
};