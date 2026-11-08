module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        floral: {
          cream: '#FAF9F6',
          blush: '#FDEED9',
          rose: '#E0A9A7',
          lavender: '#E6E6FA',
          mint: '#E3ECE1',
          sage: '#9DC183',
          earth: '#4A403A',
        },
        primary: {
          DEFAULT: '#E0A9A7', // rose
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#9DC183', // sage
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require('tailwindcss-animate')],
};
