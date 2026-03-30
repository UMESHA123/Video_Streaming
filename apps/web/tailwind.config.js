/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#e53e3e",
          light: "#fc5c65",
          dark: "#c0392b",
        },
        surface: {
          DEFAULT: "#0f0f0f",
          card: "#1a1a1a",
          hover: "#272727",
          border: "#333333",
        },
      },
    },
  },
  plugins: [],
};
