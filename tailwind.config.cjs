// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
 // add inside theme.extend
theme: {
  extend: {
    fontFamily: {
      inter: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial']
    },
    colors: {
      brand: {
        50:  "#eef2ff",
        100: "#e0f2ff",
        200: "#c7ddff",
        300: "#93c5fd",
        400: "#60a5fa",
        500: "#3b82f6", // primary
        600: "#2563eb",
        700: "#1e40af"
      }
    }
  }
},

  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
  ],
};
