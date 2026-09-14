/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gantt: {
          bg: "#0b1120",
          panel: "#0f172a",
          phase: "#1e293b",
          accent: "#3b82f6",
          accent2: "#06b6d4",
          milestone: "#f97316",
          today: "#facc15",
          s0: "#fde047",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
