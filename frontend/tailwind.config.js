/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F4C81',
          hover: '#0C3C66',
        },
        secondary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },
        accent: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
        background: '#F8FAFC',
        card: '#FFFFFF',
        textPrimary: '#0F172A',
        textSecondary: '#64748B',
        border: '#E2E8F0',
      },
      borderRadius: {
        'card': '20px',
      },
      boxShadow: {
        'soft': '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
        'premium': '0 20px 40px -15px rgba(15, 76, 129, 0.08)',
      }
    },
  },
  plugins: [],
}
