/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: '#7B1E1E',
          dark: '#5A1616',
          light: '#9B2E2E',
        },
        tan: {
          DEFAULT: '#D4A574',
          dark: '#B08A5C',
          light: '#E4C5A4',
        },
      },
    },
  },
  plugins: [],
}
