/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#d84b55",
        "accent-dark": "#b73c45",
        muted: "#6f7f8f",
        card: "#ffffff",
        bg: "#f3f5f7",
        "nav-bg": "#e7ebf0",
        heading: "#27384a",
      },
    },
  },
  plugins: [],
};
