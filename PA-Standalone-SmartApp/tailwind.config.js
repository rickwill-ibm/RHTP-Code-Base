/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // PA brand — slate-blue header matching the RHTP portal
        "pa-header": "#5d7a94",
        "pa-header-dark": "#4a6580",
        "pa-primary": "#1669c1",
        "pa-primary-dark": "#0f52a0",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("tailwindcss-animate")],
};
