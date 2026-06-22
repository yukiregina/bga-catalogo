/** @type {import('tailwindcss').Config} */
const client = require('./client.config.js')

module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      // Cores vêm do client.config.js — troque lá, reflete aqui automaticamente
      colors: {
        brand: {
          primary: client.brand.colors.primary,
          accent:  client.brand.colors.accent,
        },
        surface: {
          default:  '#FFFFFF',
          elevated: '#F7F7F8',
          sunken:   '#EFEFF1',
        },
        text: {
          primary:   '#222222',
          secondary: '#5C5C6B',
          muted:     '#6E6E7C',
          subtle:    '#3E3E4A',
          inverse:   '#FFFFFF',
          sku:       '#99999E',
        },
        border: {
          subtle:  '#DDDDE1',
          default: '#6E6E7C',
        },
        page: '#F3F2EF',
        wa:    '#25D366',
      },
      fontFamily: {
        primary: ['"Maven Pro"', 'sans-serif'],
        brand:   ['"Maven Pro"', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
}
