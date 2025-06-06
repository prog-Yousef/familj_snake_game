/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        '15': 'repeat(15, minmax(0, 1fr))', 
      }
    },
  },
  plugins: [],
  safelist: [
    // This is to ensure Tailwind generates the class for grid-cols-15 dynamically
    {
      pattern: /grid-cols-.+/,
    },
  ],
} 