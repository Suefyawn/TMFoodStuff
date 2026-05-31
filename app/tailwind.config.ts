import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
        },
        // Premium-grocer palette: deep forest green, warm clay accent, and
        // warm "cream/sand" neutrals for an upscale food-retail feel.
        forest: {
          DEFAULT: '#1b5e3f',
          dark: '#14492f',
          light: '#2d7a57',
        },
        clay: '#b4612d',
        cream: '#f7f5f0',
        sand: '#e7e2d9',
      },
      fontFamily: {
        inter: ['var(--font-inter)', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
