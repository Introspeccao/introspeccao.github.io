/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'dark',
  content: ["./*.html", "./js/*.js"],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui')
  ],
}

