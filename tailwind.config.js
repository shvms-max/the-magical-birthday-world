/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        magical: '0 18px 35px rgba(168, 85, 247, 0.2)',
      },
    },
  },
  plugins: [],
};

