/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        carbon: {
          blue: '#0f62fe',
          'blue-hover': '#0353e9',
          'blue-active': '#002d9c',
          'blue-light': '#d0e2ff',
          'blue-lighter': '#edf5ff',
          red: '#da1e28',
          'red-light': '#fff1f1',
          yellow: '#f1c21b',
          'yellow-light': '#fdf6dd',
          green: '#24a148',
          'green-light': '#defbe6',
          'gray-10': '#f4f4f4',
          'gray-20': '#e0e0e0',
          'gray-30': '#c6c6c6',
          'gray-50': '#8d8d8d',
          'gray-60': '#6f6f6f',
          'gray-70': '#525252',
          'gray-80': '#393939',
          'gray-90': '#262626',
          'gray-100': '#161616',
          'sidebar': '#161616',
          'sidebar-hover': '#262626',
        },
      },
      spacing: {
        '18': '4.5rem',
        '68': '17rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'carbon': '0 2px 6px rgba(0,0,0,0.2)',
        'carbon-md': '0 4px 16px rgba(0,0,0,0.16)',
        'carbon-lg': '0 8px 32px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-in-out',
        'slide-up': 'slideUp 200ms ease-out',
        'highlight': 'highlight 1s ease-in-out',
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
        highlight: {
          '0%': { backgroundColor: '#d0e2ff' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
};