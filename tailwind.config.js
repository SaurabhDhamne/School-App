/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#171340',
          800: '#231D5E',
          700: '#322A82',
          600: '#4338CA',
          500: '#5A4CE6',
          400: '#7B6FF0',
          100: '#EEEDFC',
          50: '#F5F5FE',
          orange: '#FF8A00',
          amber: '#FFA726',
          warm: '#FFF7ED',
          surface: '#F8F9FD'
        }
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.25rem',
        '5xl': '2.75rem'
      },
      boxShadow: {
        'soft': '0 10px 30px -5px rgba(35, 29, 94, 0.08)',
        'glow': '0 8px 25px rgba(255, 138, 0, 0.35)',
        'purple-glow': '0 12px 30px rgba(67, 56, 202, 0.28)'
      }
    },
  },
  plugins: [],
}
