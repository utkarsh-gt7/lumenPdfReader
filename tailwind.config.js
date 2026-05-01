/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Parchment — light reading surface, evokes paper
        parchment: {
          50: '#fdfaf3',
          100: '#f9f1de',
          200: '#f1e3bb',
          300: '#e6cf8a',
          400: '#d8b65a',
          500: '#c79b3b',
          600: '#a87d2c',
          700: '#876026',
          800: '#6d4d22',
          900: '#5a4020',
        },
        // Ink — primary text/dark mode surface
        ink: {
          50: '#f6f6f7',
          100: '#e7e7e9',
          200: '#cdced2',
          300: '#a8a9b0',
          400: '#7c7d86',
          500: '#5d5e69',
          600: '#444550',
          700: '#34353e',
          800: '#23242c',
          900: '#16171c',
          950: '#0b0c10',
        },
        // Royal — primary brand accent (deep blue, calm + intellectual)
        royal: {
          50: '#eef2ff',
          100: '#dde5ff',
          200: '#c0cdff',
          300: '#96a9ff',
          400: '#6b80fb',
          500: '#4a5bf3',
          600: '#3a42d9',
          700: '#3034ad',
          800: '#2a2e89',
          900: '#272b6d',
          950: '#181a40',
        },
        // Highlight palette — semantic colors for marker tools
        marker: {
          yellow: '#ffe066',
          green: '#a3e4a1',
          blue: '#9bd3ff',
          pink: '#ffb8d1',
          purple: '#d6bdfd',
          orange: '#ffc285',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Source Serif Pro"', 'Georgia', 'Cambria', 'Times', 'serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        book: '0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.55)',
        'glow-royal': '0 10px 30px -8px rgba(74,91,243,0.4)',
        page: '0 1px 2px rgba(0,0,0,0.06), 0 8px 24px -10px rgba(0,0,0,0.18)',
      },
      backgroundImage: {
        'hero-library': 'linear-gradient(135deg, rgba(74,91,243,0.85) 0%, rgba(48,52,173,0.95) 60%, rgba(24,26,64,0.98) 100%)',
        'hero-reader': 'linear-gradient(135deg, rgba(35,36,44,0.95) 0%, rgba(11,12,16,0.98) 100%)',
        'hero-notes': 'linear-gradient(135deg, rgba(168,125,44,0.75) 0%, rgba(109,77,34,0.95) 60%, rgba(35,36,44,0.98) 100%)',
        'paper-grain': "radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)",
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'slide-down': 'slideDown 0.25s ease-out',
        'pop-in': 'popIn 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        popIn: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    /**
     * Component & base layers that previously used `@apply` in index.css.
     * Living here as a Tailwind plugin keeps design tokens next to the
     * theme config and removes the `@apply` rules from the CSS file —
     * which makes generic CSS linters happy out-of-the-box.
     */
    plugin(({ addBase, addComponents, theme }) => {
      addBase({
        body: {
          backgroundColor: theme('colors.parchment.50'),
          color: theme('colors.ink.900'),
        },
        '.dark body': {
          backgroundColor: theme('colors.ink.950'),
          color: theme('colors.ink.50'),
        },
        '::-webkit-scrollbar': { width: theme('width.2'), height: theme('width.2') },
        '::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        '::-webkit-scrollbar-thumb': {
          backgroundColor: theme('colors.ink.300'),
          borderRadius: theme('borderRadius.full'),
        },
        '.dark ::-webkit-scrollbar-thumb': { backgroundColor: theme('colors.ink.700') },
        '::-webkit-scrollbar-thumb:hover': { backgroundColor: theme('colors.ink.400') },
        '.dark ::-webkit-scrollbar-thumb:hover': { backgroundColor: theme('colors.ink.600') },
      });

      // Button variants share a base. Defined once so updates flow to all.
      const btnBase = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme('gap.2'),
        padding: `${theme('padding.2')} ${theme('padding.4')}`,
        borderRadius: theme('borderRadius.lg'),
        fontWeight: theme('fontWeight.medium'),
        fontSize: theme('fontSize.sm[0]'),
        transitionProperty: 'all',
        transitionDuration: '150ms',
        '&:focus-visible': {
          outline: 'none',
          boxShadow: `0 0 0 2px ${theme('colors.parchment.50')}, 0 0 0 4px ${theme('colors.royal.500')}`,
        },
        '&:disabled': { opacity: '0.5', cursor: 'not-allowed' },
      };

      addComponents({
        '.btn': btnBase,
        '.dark .btn:focus-visible': {
          boxShadow: `0 0 0 2px ${theme('colors.ink.950')}, 0 0 0 4px ${theme('colors.royal.500')}`,
        },
        '.btn-primary': {
          ...btnBase,
          backgroundColor: theme('colors.royal.600'),
          color: theme('colors.white'),
          boxShadow: theme('boxShadow.glow-royal'),
          '&:hover': { backgroundColor: theme('colors.royal.500') },
          '&:active': { backgroundColor: theme('colors.royal.700') },
        },
        '.btn-secondary': {
          ...btnBase,
          backgroundColor: theme('colors.ink.100'),
          color: theme('colors.ink.900'),
          '&:hover': { backgroundColor: theme('colors.ink.200') },
        },
        '.dark .btn-secondary': {
          backgroundColor: theme('colors.ink.800'),
          color: theme('colors.ink.100'),
          '&:hover': { backgroundColor: theme('colors.ink.700') },
        },
        '.btn-ghost': {
          ...btnBase,
          backgroundColor: 'transparent',
          color: theme('colors.ink.600'),
          '&:hover': { backgroundColor: theme('colors.ink.100') },
        },
        '.dark .btn-ghost': {
          color: theme('colors.ink.300'),
          '&:hover': { backgroundColor: theme('colors.ink.800') },
        },
        '.btn-danger': {
          ...btnBase,
          backgroundColor: theme('colors.red.600'),
          color: theme('colors.white'),
          '&:hover': { backgroundColor: theme('colors.red.500') },
        },
        '.input': {
          width: '100%',
          padding: `${theme('padding.2')} ${theme('padding.3')}`,
          borderRadius: theme('borderRadius.lg'),
          border: `1px solid ${theme('colors.ink.200')}`,
          backgroundColor: theme('colors.white'),
          color: theme('colors.ink.900'),
          transitionProperty: 'box-shadow',
          '&::placeholder': { color: theme('colors.ink.400') },
          '&:focus-visible': {
            outline: 'none',
            borderColor: 'transparent',
            boxShadow: `0 0 0 2px ${theme('colors.royal.500')}`,
          },
        },
        '.dark .input': {
          backgroundColor: theme('colors.ink.900'),
          borderColor: theme('colors.ink.700'),
          color: theme('colors.ink.50'),
          '&::placeholder': { color: theme('colors.ink.500') },
        },
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.page'),
          border: `1px solid ${theme('colors.ink.100')}`,
        },
        '.dark .card': {
          backgroundColor: theme('colors.ink.900'),
          borderColor: theme('colors.ink.800'),
        },
        // PDF-specific overrides previously living in index.css.
        '.react-pdf__Page': {
          marginLeft: 'auto',
          marginRight: 'auto',
          backgroundColor: theme('colors.white'),
          boxShadow: theme('boxShadow.book'),
          borderRadius: theme('borderRadius.md'),
          overflow: 'hidden',
        },
        '.react-pdf__Page__textContent': { userSelect: 'text' },
        '.react-pdf__Page__textContent span': { cursor: 'text' },

        // Highlight overlay rectangle.
        '.highlight-rect': {
          position: 'absolute',
          pointerEvents: 'auto',
          mixBlendMode: 'multiply',
          borderRadius: '2px',
          cursor: 'pointer',
          transition: 'opacity 0.15s ease',
        },
        '.highlight-rect:hover': { opacity: '0.85' },
      });
    }),
  ],
};
